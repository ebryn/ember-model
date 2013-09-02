var attr = Ember.attr;

module("Ember.EmbeddedHasManyArray - embedded objects loading");

test("derp", function() {
  var json = {
    id: 1,
    title: 'foo',
    comments: [
      {id: 1, text: 'uno'},
      {id: 2, text: 'dos'},
      // ensure that records without an id work correctly
      {text: 'tres'}
    ]
  };

  var Comment = Ember.Model.extend({
    text: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
  });

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.get('comments');

  equal(comments.get('length'), 3);
  ok(Ember.run(comments, comments.get, 'firstObject') instanceof Comment);
  deepEqual(Ember.run(comments, comments.mapProperty, 'text'), ['uno', 'dos', 'tres']);
  ok(!comments.everyProperty('isNew'), "Records should not be new");
});


test("hasManyEmbedded records are available from reference cache, after collection has been accessed once", function() {
  expect(3);

  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        posts: Ember.hasMany('Ember.Post', {key: 'posts', embedded: true}),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    }),
    Post = Ember.Post = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        body: Ember.attr('string'),
        project: Ember.belongsTo('Ember.Project', {key:'project'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{
          id: 1,
          title: 'project one title',
          company: 1, 
          posts: [{id: 1, title: 'title', body: 'body', project:1 }, 
                  {id: 2, title: 'title two', body: 'body two', project:1 }]
      }] 
    };

  Company.load([compJson]);
  var company = Company.find(1);

  var project = company.get('projects.firstObject');
  var projectFromCacheViaFind = Project.find(project.get('id'));
  var projectRecordFromCache = Project._referenceCache[project.get('id')].record;

  equal(project, projectFromCacheViaFind);
  equal(project, projectRecordFromCache);

  var post = project.get('posts.firstObject');
  var postFromCache = Post.find(post.get('id'));
  equal(post, postFromCache);

});


test("hasManyEmbedded records reload existing records with embedded information", function() {


  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one title', company: 1 },
              { id: 2, title: 'project two title', company: 1 }]  
    }, compJson2 = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one new title', company: 1 },
              { id: 2, title: 'project two new title', company: 1 }]  
    };

  Company.load([compJson]);
  var company = Company.find(1);
  var project1 = company.get('projects.firstObject');

  equal(company.get('projects.length'), 2);

  Company.load([compJson2]);
  company = Company.find(1);
  var reloadedProject1 = company.get('projects.firstObject');

  equal(project1, reloadedProject1);
  equal(project1.get('title'), 'project one new title');
  equal(reloadedProject1.get('title'), 'project one new title');
});


test("hasManyEmbedded records only materialize once", function() {


  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one title', company: 1 },
              { id: 2, title: 'project two title', company: 1 }]  
    };

  Company.load([compJson]);
  var company = Company.find(1);
  var project1 = company.get('projects.firstObject');

  project1.set('title', 'hello world');

  var project1Again = company.get('projects').objectAt(0);
  equal(project1Again, project1);
  equal(project1Again.get('title'), 'hello world');

  equal(company.get('projects.length'), 2);
});


test("hasManyEmbedded records can be found using find, after collection has been accessed", function() {


  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one title', company: 1 },
              { id: 2, title: 'project two title', company: 1 }]  
    };

  Company.load([compJson]);
  var company = Company.find(1);
  var firstProject = company.get('projects.firstObject');
  var project1 = Ember.Project.find(1);
  var project1Again = company.get('projects').objectAt(0);
  equal(project1Again, project1);
  equal(firstProject, project1);
});


test("hasManyEmbedded records reload previously loaded records with new information", function() {


  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one title', company: 1 },
              { id: 2, title: 'project two title', company: 1 }]  
    };

  var projectJson = { id:1, title:'old project one title', company:1};

  Project.load([projectJson]);
  var project1 = Project.find(1);

  equal(project1.get('title'), 'old project one title');

  Company.load([compJson]);
  var company = Company.find(1);
  var firstProject = company.get('projects.firstObject');
  equal(firstProject, project1);
  equal(project1.get('title'), 'project one title');
  
});

test("hasManyEmbedded records newRecord creates a new record", function() {


  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true, newRecord: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one title', company: 1 },
              { id: 2, title: 'project two title', company: 1 }]  
    };

  var projectJson = { id:1, title:'old project one title', company:1};

  Project.load([projectJson]);
  var project1 = Project.find(1);

  equal(project1.get('title'), 'old project one title');

  Company.load([compJson]);
  var company = Company.find(1);
  var project1NewRecord = company.get('projects.firstObject');
  notEqual(project1NewRecord, project1);
  equal(project1.get('title'), 'old project one title');
  equal(project1NewRecord.get('title'), 'project one title');
  
});

