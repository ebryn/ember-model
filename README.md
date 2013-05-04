# Ember.Model [![Build Status](https://travis-ci.org/ebryn/ember-model.png?branch=master)](https://travis-ci.org/ebryn/ember-model)

## Introduction

Ember Model (EM) is a simple and lightweight model library for Ember. It intentionally supports a limited feature set. The main goal is to provide primitives on top of $.ajax that are required by Ember.

EM makes it easy to provide hooks for making requests to your server, and requires you to convert the response into a model object. If your response does not look the same as your model's attributes, you will need to manually convert them before loading them.

EM is still very much a work in progress, but it's flexible enough to be used in apps today. It was extracted out of an Ember app. Please see the issues section for a list of bugs and planned features.

## Features

- BYO$A (bring your own $.ajax)
- Focused on performance
- Automatic coalescing of multiple findById calls into a single findMany
- Fixtures
- Identity map (per class)
- Promises everywhere
- RESTAdapter coming soon

If you want more features than Ember Model provides, file an issue. Feature requests/contributions are welcome but the goal is to keep things simple and fast.

## Example usage

```coffeescript
attr = Ember.attr

App.User = Ember.Model.extend
  id: attr()
  name: attr()
  goal: attr()
  lastWeight: attr()

App.User.adapter = Ember.Adapter.create
  findAll: (klass, recordArray) ->
    $.getJSON("/users").then (data) ->
      recordArray.load klass, data

App.WeighIn = Ember.Model.extend
  id: attr()
  user_id: attr()
  weight: attr()

App.WeighIn.adapter = Ember.FixtureAdapter.create()

App.WeighIn.FIXTURES = [
  {id: 1, user_id: 1, weight: 210}
]
```

## Model API

`Model#create` - create a new record

`Model#save` - save or update record

`Model#load` - load JSON into the record (typically used inside adapter definition)

`Model#toJSON` - get the 

`Model.find()` - find all

`Model.find(<String|Number>)` - find by ID (multiple calls within a single run loop can coalesce to a findMany)

`Model.find(<object>)` - find query - object gets passed directly to your adapter

`Model.load(<array>)` - load an array of model data (aka sideloading)

## Adapter API

```javascript
Ember.Adapter = Ember.Object.extend({
  find: function(record, id) {}, // find a single record
  
  findAll: function(klass, records) {}, // find all records
  
  findMany: function(klass, records, ids) {}, // find many records by ID (batch find)

  findQuery: function(klass, records, params) {}, // find records using a query

  createRecord: function(record) {}, // create a new record on the server

  saveRecord: function(record) {}, // save an existing record on the server

  deleteRecord: function(record) {} // delete a record on the server
});
```

### Special Thanks

Yehuda Katz (@wycats), Tom Dale (@tomdale), Igor Terzic (@igorT), and company for their amazing work on Ember Data. I believe it's the most ambitious JS project today. The goal is someday everyone's JSON APIs will be conventional enough that Ember Data will be the best choice of data library for Ember. Until then, Ember Model will make it easy to get up and running quickly with Ember.
