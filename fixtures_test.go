package main

import (
	"github.com/fsouza/go-dockerclient"
	"github.com/stretchr/testify/mock"
)

const testBaseImg = "test-base-image"

var testSchema = ChallengeSchema{
	Owner:       "id1",
	Name:        "TestSchema",
	Rev:         1,
	Description: "Schema used for testing",
	Start: []FileSchema{
		{Name: "password.txt", Contents: "hunter2"},
		{Name: "nothing", Contents: ""},
	},
	End: nil,
}

var testContainer = docker.Container{
	ID: "testID",
}

type MockLog struct {
	mock.Mock
}

type MockDocker struct {
	mock.Mock
}

type MockIter struct {
	mock.Mock
}

func (m *MockDocker) GenerateImage(challenge ChallengeSchema, baseImg string) error {
	return nil
}

func (m *MockDocker) PullImage(opts docker.PullImageOptions, auth docker.AuthConfiguration) error {
	args := m.Mock.Called(opts, auth)
	return args.Error(0)
}

func (m *MockDocker) CreateContainer(opts docker.CreateContainerOptions) (*docker.Container, error) {
	m.Mock.Called(opts)
	container := new(docker.Container)
	container.ID = "testID"
	return container, nil
}

func (m *MockDocker) StartContainer(id string, hostConfig *docker.HostConfig) error {
	m.Mock.Called(id, hostConfig)
	return nil
}

func (m *MockDocker) WaitContainer(id string) (int, error) {
	m.Mock.Called(id)
	return 0, nil
}

func (m *MockDocker) CommitContainer(opts docker.CommitContainerOptions) (*docker.Image, error) {
	m.Mock.Called(opts)
	return new(docker.Image), nil
}

func (m *MockIter) Next(inter interface{}) bool {
	args := m.Mock.Called(inter)
	return args.Bool(0)
}

func (m *MockIter) Close() error {
	args := m.Mock.Called()
	return args.Error(0)
}

func (l *MockLog) Fatalln(msgs ...interface{}) {
	l.Mock.Called(msgs)
}
