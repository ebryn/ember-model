# Ember.Model [![Build Status](https://travis-ci.org/ebryn/ember-model.png?branch=master)](https://travis-ci.org/ebryn/ember-model)

## Introduction

Ember Model (EM) is a simple and lightweight model library for Ember. It intentionally supports a limited feature set. The main goal is to provide primitives on top of $.ajax that are required by Ember.

EM is still very much a work in progress, but it's flexible enough to be used in apps today. It was extracted out of an Ember app. Please see the issues section for a list of bugs and planned features.

## Getting Started with Ember Model

[Download latest build of Ember Model](http://builds.erikbryn.com/ember-model/ember-model-latest.js)

[![Getting started Embercast](http://f.cl.ly/items/1T1t2T2p3d2u0A2b0q2P/embercast.png)](http://www.embercasts.com/episodes/getting-started-with-ember-model)

Need more help getting started? Join us in #ember-model on Freenode.

## Features

- BYO$A (bring your own $.ajax)
- Relationships (hasMany/belongsTo)
- Focused on performance
- Automatic coalescing of multiple findById calls into a single findMany
- Customizable dirty tracking (great for embedded objects)
- Fixtures
- Identity map (per class)
- Promises everywhere
- Customizable RESTAdapter

If you want more features than Ember Model provides, file an issue. Feature requests/contributions are welcome but the goal is to keep things simple and fast.

## Example usage

```javascript
var attr = Ember.attr, hasMany = Ember.hasMany;

// Model definitions
App.User = Ember.Model.extend({
  id: attr(),
  name: attr(),
  comments: hasMany("App.Comment", {key: 'comment_ids'})
});

App.User.url = "/users";
App.User.adapter = Ember.RESTAdapter.create();

App.Comment = Ember.Model.extend({
  id: attr(),
  text: attr()
});

App.Comment.url = "/comments";
App.Comment.adapter = Ember.RESTAdapter.create();

// create example

var newUser = App.User.create({name: "Erik"});
newUser.save(); // POST to /users.json

// hasMany example
var comments = newUser.get('comments');
comments.create({text: "hello!"});
comments.save(); // POST to /comments.json

// find & update example

var existingUser = App.User.find(1); // GET /users/1.json
existingUser.set('name', 'Kris');
existingUser.get('isDirty'); // => true
existingUser.save(); // PUT /users/1.json
```

## Model API

`Model#create` - create a new record

`Model#save` - save or update record

`Model#load` - load JSON into the record (typically used inside adapter definition)

`Model#toJSON` - serialize the record to JSON

`Model.find()` - find all records

`Model.find(<String|Number>)` - find by primary key (multiple calls within a single run loop can coalesce to a findMany)

`Model.find(<object>)` - find query - object gets passed directly to your adapter

`Model.load(<array>)` - load an array of model data (aka sideloading)

## Adapter API

```javascript
Ember.Adapter = Ember.Object.extend({
  find: function(record, id) {}, // find a single record

  findAll: function(klass, records) {}, // find all records

  findMany: function(klass, records, ids) {}, // find many records by primary key (batch find)

  findQuery: function(klass, records, params) {}, // find records using a query

  createRecord: function(record) {}, // create a new record on the server

  saveRecord: function(record) {}, // save an existing record on the server

  deleteRecord: function(record) {} // delete a record on the server
});
```
## Attribute types

Attributes by default have no type and are not typecast from the representation
provided in the JSON format. Objects and arrays are cloned, so that clean copy
of the attribute is maintained internally in case of wanting to revert a dirty
record to a clean state.

### Built in attribute types

Ember Model has built in `Date` and `Number` types. The `Date` type will deserialize
strings into a javascript Date object, and will serialize dates into
[ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) format. The `Number` type will
cast into a numeric type on serialization and deserialization.

```javascript
App.Post = Ember.Model.extend({
  date: attr(Date),
  comment_count: attr(Number)
});
```
### Custom attribute types

To provide custom attribute serialization and deserialization, create an object that
has serialize and deserialize functions, and pass it into the attr helper:

```javascript
var Time = {
  serialize: function(time) {
    return time.hour + ":" + time.min;
  },
  deserialize: function(string) {
    var array = string.split(":");
    return {
      hour: parseInt(array[0], 10),
      min: parseInt(array[1], 10)
    };
  }
};

var Post = Ember.Model.extend({
  time: attr(Time)
});
```

## Customizing

There are a few properties you can set on your class to customize how either
`Ember.Model` or `Ember.RESTAdapter` work:

### primaryKey

The property Ember Model uses for a per-record unique value (default: "id").

```javascript
App.User = Ember.Model.extend({
  token: attr(),
  name: attr()
});
App.User.primaryKey = 'token';
```

```
GET /users/a4bc81f90.json
{"token": "a4bc81f90", "name": "Brian"}
```

### rootKey

When `RESTAdapter` creates a record from data loaded from the server it will
use the data from this property instead of the whole response body.

```javascript
App.User = Ember.Model.extend({
  name: attr()
});
App.User.rootKey = 'user';
```

```
GET /users/1.json
{"user": {"id": 1, "name": "Brian"}}
```

### collectionKey

When `RESTAdapter` creates multiple records from data loaded from the server it
will use the data from this property instead of the whole response body.

```javascript
App.User = Ember.Model.extend({
  name: attr()
});
App.User.collectionKey = 'users';
```

```
GET /users.json
{"users": [{"id": 1, "name": "Brian"}]}
```

## Building Ember-Model
Ember-Model uses [node.js](http://nodejs.org/) and [grunt](http://gruntjs.com/) as a build system,
These three libraries will need to be installed before building.
 
To build Ember-Model, clone the repository, and run `npm install` to install build dependencies
and `grunt` to build the library.

Unminified and minified builds of Ember-Model will be placed in the `dist`
directory.

## How to Run Unit Tests

### Setup

Ember-Model uses [node.js](http://nodejs.org/) and [grunt](http://gruntjs.com/) as a build system
and test runner, and [bower](http://bower.io/) for dependency management.

To test Ember-Model run `npm install` to install build dependencies, `bower install` to install the
runtime dependencies and `grunt test` to execute the test suite headlessly via phantomjs.

### In Your Browser
???

## Who's using Ember Model?

* [LiveNation](http://www.livenation.com)
* [Square](http://www.squareup.com)
* [Embercasts](http://www.embercasts.com)
* [Digital Science](http://www.digital-science.com)
* [Travis CI](https://travis-ci.org)
* [Bugzilla-Ember](https://github.com/ebryn/bugzilla-ember)

Are you using Ember Model? Submit a pull request to add your project to this list!

## Special Thanks

Yehuda Katz (@wycats), Tom Dale (@tomdale), Igor Terzic (@igorT), and company for their amazing work on Ember Data. I believe it's the most ambitious JS project today. The goal is someday everyone's JSON APIs will be conventional enough that Ember Data will be the best choice of data library for Ember. Until then, Ember Model will make it easy to get up and running quickly with Ember.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ebryn/ember-model/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
