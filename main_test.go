package main

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestPullBase(t *testing.T) {
	mdocker := new(MockDocker)
	config := Config{}
	config.Docker.BaseImage = "test-baseimage"
	mdocker.Mock.On("PullImage", mock.Anything, mock.Anything).Return(nil)
	pullBase(mdocker)
}

func TestCreateImages(t *testing.T) {
	config := Config{}
	config.Docker.BaseImage = "test-baseimage"
	iter := new(MockIter)
	iter.Mock.On("Next", mock.Anything).Return(true).Times(5)
	iter.Mock.On("Next", mock.Anything).Return(false)
	iter.Mock.On("Close").Return(nil)
	mdocker := new(MockDocker)
	mdocker.Mock.On("GenerateImage", mock.AnythingOfType("ChallengeSchema"), mock.AnythingOfType("string")).Return(nil)
	createImages(mdocker, iter)
}

func TestCreateImagesFailure(t *testing.T) {
	config := Config{}
	config.Docker.BaseImage = "test-baseimage"
	iter := new(MockIter)
	iter.Mock.On("Next", mock.Anything).Return(false)
	iter.Mock.On("Close").Return(errors.New("Error iterating"))
	mdocker := new(MockDocker)
	mdocker.Mock.On("GenerateImage", mock.AnythingOfType("ChallengeSchema"), mock.AnythingOfType("string")).Return(nil)
	assert.Panics(t, func() {
		createImages(mdocker, iter)
	})
}
