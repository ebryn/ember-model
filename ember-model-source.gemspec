# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'ember/model/source/version'

Gem::Specification.new do |spec|
  spec.name          = "ember-model-source"
  spec.version       = Ember::Model::Source::VERSION
  spec.authors       = ["Erik Bryn"]
  spec.email         = ["erik.bryn@gmail.com"]
  spec.summary       = %q{Ember.js Model source code wrapper.}
  spec.description   = %q{Ember.js Model source code wrapper for use with Ruby libs.}
  spec.homepage      = "https://github.com/ebryn/ember-model"
  spec.license       = "MIT"

  spec.files         = `git ls-files`.split($/)
  spec.require_paths = ["lib"]

  spec.add_dependency "ember-source"

  spec.add_development_dependency "bundler"
  spec.add_development_dependency "rake"
end
