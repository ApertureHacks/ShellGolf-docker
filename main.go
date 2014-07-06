package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"labix.org/v2/mgo"

	"github.com/fsouza/go-dockerclient"
	"github.com/streadway/amqp"
)

type Config struct {
	Docker struct {
		BaseImage string
		Endpoint  string
	}
	Db struct {
		Uri      string
		Database string
	}
	Rabbitmq struct {
		Uri string
	}
}

type FileSchema struct {
	Name     string
	Contents string
}

type ChallengeSchema struct {
	Owner        string
	Name         string
	Rev          int
	Description  string
	Instructions string
	Start        []FileSchema
	End          []FileSchema
}

func main() {
	var err error

	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	file, err := os.Open("config.json")
	if err != nil {
		log.Print("ERROR reading config:" + err.Error())
	}
	decoder := json.NewDecoder(file)
	config := Config{}
	err = decoder.Decode(&config)
	if err != nil {
		log.Fatalln("ERROR loading config:", err)
	}

	client, err := docker.NewClient(config.Docker.Endpoint)
	if err != nil {
		log.Fatalln("ERROR connecting to docker:", err)
	}

	mongoSession, err := mgo.Dial(config.Db.Uri)
	if err != nil {
		log.Fatalln("ERROR connecting to database:", err.Error())
	}
	defer mongoSession.Close()
	db := mongoSession.DB(config.Db.Database)

	broker, err := amqp.Dial(config.Rabbitmq.Uri)
	if err != nil {
		log.Fatalln(err)
	}
	defer broker.Close()
	channel, err := broker.Channel()
	if err != nil {
		log.Fatalln(err)
	}

	log.Println("Pulling shellgolf base image.")
	err = client.PullImage(docker.PullImageOptions{Repository: config.Docker.BaseImage, OutputStream: os.Stdout}, docker.AuthConfiguration{})
	if err != nil {
		log.Fatalln("ERROR pulling base image:", err)
	}

	challenge := ChallengeSchema{}
	iter := db.C("challenges").Find(nil).Iter()
	var wg sync.WaitGroup
	for iter.Next(&challenge) {
		wg.Add(1)
		go func(challenge ChallengeSchema) {
			defer wg.Done()
			log.Println("Generating image for", challenge.Name)
			generateContainer(challenge, config.Docker.BaseImage, client)
		}(challenge)
	}
	if err = iter.Close(); err != nil {
		go log.Fatalln("ERROR generating images:", err)
	}
	wg.Wait()

	subRunCode(channel)
}

func generateContainer(challenge ChallengeSchema, baseImage string, client *docker.Client) (err error) {
	var createFiles bytes.Buffer
	createFiles.WriteString("umask 022")
	for i := range challenge.Start {
		file := challenge.Start[i]
		createFiles.WriteString(" && mkdir -p `dirname " + file.Name + "` &&")
		if len(file.Contents) <= 0 {
			createFiles.WriteString("touch " + file.Name)
		} else {
			createFiles.WriteString("echo $'" + file.Contents + "' > " + file.Name)
		}
	}

	r := strings.NewReplacer(" ", "_")

	opts := docker.CreateContainerOptions{
		// Name: strings.ToLower(r.Replace(challenge.Name)),
		Config: &docker.Config{
			Image:      baseImage,
			WorkingDir: "/home/golfer",
			Hostname:   "shellgolf",
			User:       "golfer",
			Cmd:        []string{"/bin/sh", "-c", createFiles.String()},
		},
	}

	container, err := client.CreateContainer(opts)
	if err != nil {
		log.Fatalln("ERROR generating container for ", challenge.Name, err)
	}

	err = client.StartContainer(container.ID, nil)
	if err != nil {
		log.Fatalln(err)
	}

	ret, err := client.WaitContainer(container.ID)
	if err != nil {
		log.Fatalln(err)
	} else if ret != 0 {
		log.Fatalln("Creating container for", challenge.Name, "failed with return code", ret)
	}

	commitOpts := docker.CommitContainerOptions{
		Container:  container.ID,
		Repository: strings.ToLower(r.Replace(challenge.Name)) + "_rev" + fmt.Sprintf("%d", challenge.Rev),
	}
	_, err = client.CommitContainer(commitOpts)
	if err != nil {
		log.Fatalln(err)
	}

	return
}

func subRunCode(channel *amqp.Channel) {
	var err error
	_, err = channel.QueueDeclare("runCode", false, true, false, false, nil)
	if err != nil {
		log.Fatalln(err)
	}
	// FIXME: unique consumer string?
	_, err = channel.Consume("runCode", "", true, false, true, false, nil)
	if err != nil {
		log.Fatalln(err)
	}
}
