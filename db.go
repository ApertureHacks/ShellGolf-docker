package main

import "labix.org/v2/mgo"

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

type Database interface {
}

type Iterator interface {
	Next(interface{}) bool
	Close() error
}

type Db struct {
	*mgo.Database
}

func (d *Db) Connect() (err error) {
	session, err := mgo.Dial(config.Db.Uri)
	if err != nil {
		return
	}

	database := session.DB(config.Db.Database)
	*d = Db{database}

	return
}

func (d *Db) Close() {
	d.Session.Close()
}
