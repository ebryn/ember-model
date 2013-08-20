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

`Model#deleteRecord` - delete a record

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
provided in the JSON format.

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

## Relationships

Ember Model provides two types of relationships `hasMany` and `belongsTo`. Both types of relationships can either be embedded or referenced by ids.

### Defining Relationships

Relationships are defined by using relationship computed property macros in place of `Ember.attr`. There are two macros available, one for each type of relationship.

`Ember.belongsTo(type, options)` - Provides access to a single related object.

`Ember.hasMany(type, options)` - Provides access to an array of related objects.

Both relationships take two arguments. 

- `type` - Class of the related model or string representation (eg. App.Comment or 'App.Comment').

- `options` - An object with two properties, `key` which is required and `embedded` which is optional and defaults to `false`.

  - `key` - indicates what property of the JSON backing the model will be accessed to access the relationship
  - `embedded` - If `true` the related objects are expected to be present in the data backing the model. If `false` only the primaryKeys are present in the data backing the model. These keys will be used to load the correct model.

### Relationship Examples

```javascript
// Embedded Relationship Example

postJson = {
  id: 99,
  title: 'Post Title',
  body: 'Post Body',
  comments: [
    {
      id: 1,
      body: 'comment body one',
    },
    {
      id: 2,
      body: 'comment body two'
    }
  ]
};

App.Post = Ember.Model.extend({
  id: Ember.attr(),
  title: Ember.attr(),
  body: Ember.attr(),
  comments: Ember.hasMany('App.Comment', {key: 'comments', embedded: true})
});

App.Comment = Ember.Model.extend({
  id: Ember.attr(),
  body: Ember.attr()
});
```

```javascript
// ID-based Relationship Example

postJson = {
  id: 99,
  title: 'Post Title',
  body: 'Post Body',
  comment_ids: [1, 2]
};

commentsJson = [
  {
    id: 1,
    body: 'Comment body one',
    post_id: 99
  },
  {
    id: 2,
    body: 'Coment body two',
    post_id: 99
  }
];

App.Post = Ember.Model.extend({
  id: Ember.attr(),
  title: Ember.attr(),
  body: Ember.attr()
  comments: Ember.hasMany('App.Comment', {key: 'comment_ids'})
});

App.Comment = Ember.Model.extend({
  id: Ember.attr(),
  body: Ember.attr(),
  post: Ember.belongsTo('App.Post', {key: 'post_id'})
})
```

### Working with relationships

Working with a `belongsTo` relationship is just like working any other `Ember.Model`. An `Ember.Model` instance is returned when accessing a `belongsTo` relationship, so any `Model` methods can be used such as `save()` or `reload()`.

```javascript
comment.get('post').reload(); // Reloads the comments post

post.get('comments.lastObject').save(); // Saves the last comment associated to post
```

Accessing a `hasMany` relationship returns a `HasManyArray` or an `EmbeddedHasManyArray` which have useful methods for working with the collection of records. On any type of `hasMany` relationship you can call `save()` and all the dirty records in the collection will have their `save()` methods called. When working with an embedded `hasMany` relationship you can use the `create(attrs)` method to add a new record to the collection.

```javascript
post.get('comments').save(); // Saves all dirty comments on post

// Below only works on embedded relationships
post.get('comments').create({body: 'New Comment Body'}); // Creates a new comment associated to post
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


### camelizeKeys


If the server sends keys with underscores (ex: ```created_at```),
rather than camelized (ex: ```createdAt```), setting this option to ```true```
makes Ember Model automatically camelize the keys.

```javascript
App.User = Ember.Model.extend({
  firstName: attr()
});
App.User.camelizeKeys = true;
```

```
GET /users/1.json
{"id": 1, "first_name": "Brian"}
```

```javascript
user.get('firstName') // => Brian
```


### Customize Ajax Settings

When using `RESTAdapter` custom headers and ajax settings can be applied by extending `RESTAdapter` and defining `ajaxSettings`

```
App.CustomAdapter = Ember.RESTAdapter.extend({
  ajaxSettings: function(url, method) {
    return {
      url: url,
      type: method,
      headers: {
        "authentication": "xxx-yyy"
      },
      dataType: "json"
    };
  }
});
```

or it can be done at create time of the RESTAdapter

```
App.User.adapter = Ember.RESTAdapter.create({
  ajaxSettings: function(url, method) {
    return {
      url: url,
      type: method,
      headers: {
        "authentication": "xxx-yyy"
      },
      dataType: "json"
    };
  }
});
```



## Building Ember Model
Ember Model uses [node.js](http://nodejs.org/) and [grunt](http://gruntjs.com/) as a build system,
These three libraries will need to be installed before building.

To build Ember Model, clone the repository, and run `npm install` to install build dependencies
and `grunt` to build the library.

Unminified and minified builds of Ember Model will be placed in the `dist`
directory.

## How to Run Unit Tests

### Setup

Ember Model uses [node.js](http://nodejs.org/) and [grunt](http://gruntjs.com/) as a build system
and test runner, and [bower](http://bower.io/) for dependency management.

If you have not used any of these tools before, you will need to run `npm install -g bower` and
`npm install -g grunt-cli` to be able to use them.

To test Ember Model run `npm install` to install build dependencies, `bower install` to install the
runtime dependencies and `grunt test` to execute the test suite headlessly via phantomjs.

If you prefer to run tests in a browser, you may start a development server using
`grunt develop`. Tests are available at http://localhost:8000/tests

## Who's using Ember Model?

* [LiveNation](http://www.livenation.com)
* [Square](http://www.squareup.com)
* [Embercasts](http://www.embercasts.com)
* [Digital Science](http://www.digital-science.com)
* [Travis CI](https://travis-ci.org)
* [Bugzilla-Ember](https://github.com/ebryn/bugzilla-ember)
* [Embriak](http://github.com/joachimhs/Embriak)

Are you using Ember Model? Submit a pull request to add your project to this list!

## Special Thanks

Yehuda Katz (@wycats), Tom Dale (@tomdale), Igor Terzic (@igorT), and company for their amazing work on Ember Data. I believe it's the most ambitious JS project today. The goal is someday everyone's JSON APIs will be conventional enough that Ember Data will be the best choice of data library for Ember. Until then, Ember Model will make it easy to get up and running quickly with Ember.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ebryn/ember-model/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
![](https://d3oi6fmp1dfbdb.cloudfront.net/g.gif?repo=ebryn/ember-model)
