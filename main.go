package main

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/fsouza/go-dockerclient"
	"github.com/streadway/amqp"
)

var config Config

func main() {
	var err error
	defer recoverLog()

	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	loadConfig()

	client := loadDocker()
	db := loadDb()
	// defer db.Close()

	broker := loadBroker()
	channel, err := broker.Channel()
	if err != nil {
		panic(err)
	}

	pullBase(client)
	createImages(client, db.C("challenges").Find(nil).Iter())

	log.Println("Subscribing to runCode")
	subRunCode(channel)
}

func recoverLog() {
	if r := recover(); r != nil {
		log.Fatalln("Panic:", r)
	}
}

func subRunCode(channel *amqp.Channel) {
	var err error
	_, err = channel.QueueDeclare("runCode", false, true, false, false, nil)
	if err != nil {
		panic(err)
	}
	// FIXME: unique consumer string?
	submissions, err := channel.Consume("runCode", "", true, false, true, false, nil)
	if err != nil {
		panic(err)
	}

	for sub := range submissions {
		log.Println("sub: ", sub)
		log.Println("sub.Body:", string(sub.Body))
	}
}

func loadConfig() {
	err := config.load()
	if err != nil {
		panic(fmt.Sprintf("ERROR loading config file: %s", err))
	}
}

func loadDocker() DockerClient {
	client, err := NewDocker(config.Docker.Endpoint)
	if err != nil {
		panic(fmt.Sprintf("ERROR connecting to docker: %s", err))
	}
	return client
}

func loadDb() *Db {
	db := new(Db)
	err := db.Connect()
	if err != nil {
		panic(fmt.Sprintf("ERROR connecting to database: %s", err))
	}
	return db
}

func loadBroker() *amqp.Connection {
	broker, err := amqp.Dial(config.Rabbitmq.Uri)
	if err != nil {
		panic(err)
	}
	return broker
}

func pullBase(client DockerClient) {
	log.Println("Pulling shellgolf base image.")
	err := client.PullImage(docker.PullImageOptions{Repository: config.Docker.BaseImage, OutputStream: os.Stdout}, docker.AuthConfiguration{})
	if err != nil {
		panic(fmt.Sprintf("ERROR pulling base image: %s", err))
	}
}

func createImages(client DockerClient, iter Iterator) {
	challenge := ChallengeSchema{}
	var wg sync.WaitGroup

	for iter.Next(&challenge) {
		wg.Add(1)
		go func(challenge ChallengeSchema) {
			defer wg.Done()
			log.Println("Generating image for", challenge.Name)
			err := client.GenerateImage(challenge, config.Docker.BaseImage)
			if err != nil {
				panic(err)
			}
		}(challenge)
	}

	if err := iter.Close(); err != nil {
		panic(fmt.Sprintf("ERROR generating images: %s", err))
	}
	wg.Wait()
}
