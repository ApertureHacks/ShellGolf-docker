package main

import (
	"encoding/json"
	"os"
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

func (c *Config) load() (err error) {
	file, err := os.Open("config.json")
	if err != nil {
		return
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	err = decoder.Decode(c)
	if err != nil {
		return
	}

	return
}
