package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestDockerSatisfiesInterface(t *testing.T) {
	assert.Implements(t, (*DockerClient)(nil), new(Docker))
}

func TestGenerateImage(t *testing.T) {
	mdocker := new(MockDocker)
	mdocker.On("CreateContainer", mock.Anything).Return(&testContainer, nil)
	mdocker.On("StartContainer", testContainer.ID, mock.AnythingOfType("*docker.HostConfig")).Return(nil)
	mdocker.On("WaitContainer", mock.Anything).Return(0, nil)
	mdocker.On("CommitContainer", mock.Anything).Return(nil, nil)

	err := generateImage(mdocker, testSchema, testBaseImg)

	assert.NoError(t, err)
}
