package main

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/fsouza/go-dockerclient"
)

type DockerClient interface {
	GenerateImage(ChallengeSchema, string) error
	PullImage(docker.PullImageOptions, docker.AuthConfiguration) error
	CreateContainer(docker.CreateContainerOptions) (*docker.Container, error)
	StartContainer(string, *docker.HostConfig) error
	WaitContainer(id string) (int, error)
	CommitContainer(opts docker.CommitContainerOptions) (*docker.Image, error)
}

type Docker struct {
	*docker.Client
}

func NewDocker(endpoint string) (DockerClient, error) {
	client, err := docker.NewClient(endpoint)

	return &Docker{client}, err
}

func (client *Docker) GenerateImage(challenge ChallengeSchema, baseImage string) error {
	return generateImage(client, challenge, baseImage)
}

func generateCommand(files []FileSchema) bytes.Buffer {
	var createFiles bytes.Buffer
	createFiles.WriteString("umask 022")

	for _, file := range files {
		createFiles.WriteString(" && mkdir -p `dirname " + file.Name + "` &&")
		if len(file.Contents) <= 0 {
			createFiles.WriteString("touch " + file.Name)
		} else {
			createFiles.WriteString("echo $'" + file.Contents + "' > " + file.Name)
		}
	}

	return createFiles
}

func generateImage(client DockerClient, challenge ChallengeSchema, baseImage string) (err error) {

	r := strings.NewReplacer(" ", "_")

	createFiles := generateCommand(challenge.Start)

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
		return
	}

	err = client.StartContainer(container.ID, nil)
	if err != nil {
		return
	}

	ret, err := client.WaitContainer(container.ID)
	if err != nil {
		return
	} else if ret != 0 {
		return
	}

	commitOpts := docker.CommitContainerOptions{
		Container:  container.ID,
		Repository: strings.ToLower(r.Replace(challenge.Name)) + "_rev" + fmt.Sprintf("%d", challenge.Rev),
	}
	_, err = client.CommitContainer(commitOpts)
	if err != nil {
		return
	}

	return
}
