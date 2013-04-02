# Ember.Model

## Introduction

Ember Model (EM) is a simple and lightweight model library for Ember. It intentionally supports a limited feature set. For example, it does not support mutable relationships. The main goal is to provide primitives on top of $.ajax that are required by Ember.

EM makes it easy to provide hooks for making requests to your server, and requires you to convert the response into a model object. If your response does not look the same as your model's attributes, you will need to manually convert them before loading them.

EM supports a per-class identity map. It will probably work for most cases, but it may not work in all cases.

In the medium term, the goal of Ember Model is to make it possible for your models and basic application code to be portable to Ember Data if you should need it. Your adapters will need to be updated, and there may be some approaches you are using (for example, hand-rolled features on top of EM) that may not directly port to Ember Data.


EM is still very much a work in progress, but it's flexible enough to be used in apps today. It was extracted out of an Ember app. Please see the issues section for a list of bugs and planned features.

## When you should use EM

EM is great for apps dealing mostly with read-only data and that don't embed data frequently. If you've got a Rails-style RESTful API, it should be pretty easy to get up and running.

## Features

- BYO$A (bring your own $.ajax)
- Fixtures
- Identity map (per class)
- RESTAdapter coming soon
- Promises everywhere

If you want more features than Ember Model provides, you should probably use Ember Data (warning: Ember Data is still in alpha) or roll them yourself in your app or on top of Ember Model. Feature requests/contributions are welcome but the goal is to keep things simple.

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

## Adapter API

```javascript
Ember.Adapter = Ember.Object.extend({
  find: function(record, id) {}, // find a single record

  findAll: function(klass, records) {}, // find all records

  findQuery: function(klass, records, params) {}, // find records using a query

  createRecord: function(record) {}, // create a new record on the server

  saveRecord: function(record) {}, // save an existing record on the server

  deleteRecord: function(record) {} // delete a record on the server
});
```

Here's an example RESTAdapter:

```coffeescript
App.RESTAdapter = Ember.Adapter.extend
  saveRecord: (record) ->
    klass = record.constructor
    rootKey = Ember.get(klass, 'rootKey')
    data = {}
    data[rootKey] = record.toJSON()
    $.ajax("#{Ember.get klass, 'url'}/#{record.get 'id'}.json",
      type: 'PUT'
      data: data
    ).then (data) =>
      Ember.run =>
        # @setProperties(data) # rails doesn't return data
        record.set 'isSaving', false

  createRecord: (record) ->
    klass = record.constructor
    rootKey = Ember.get(klass, 'rootKey')
    data = {}
    data[rootKey] = record.toJSON()
    $.ajax("#{Ember.get klass, 'url'}.json"
      type: 'POST'
      data: data
    ).then (data) =>
      Ember.run =>
        record.load(data)

  deleteRecord: (record) ->
    klass = record.constructor
    url = "#{Ember.get klass, 'url'}/#{record.get 'id'}.json"
    $.ajax(url,
      type: 'DELETE'
    ).then (data) =>
      Ember.run =>
        record.didDeleteRecord()

  findAll: (klass, recordArray) ->
    $.getJSON "#{Ember.get klass, 'url'}.json", {}, (data) =>
      Ember.run =>
        recordArray.load klass, data[Ember.get klass, 'collectionKey']

  find: (record, id) ->
    $.getJSON "#{Ember.get record.constructor, 'url'}/#{id}.json", {}, (data) ->
      Ember.run =>
        record.load(data)
```

### Special Thanks

Yehuda Katz (@wycats), Tom Dale (@tomdale), Igor Terzic (@igorT), and company for their amazing work on Ember Data. I believe it's the most ambitious JS product today. I can't wait until we all crack the nut and I can throw this code away. :heart: