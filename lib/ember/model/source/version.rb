require 'json'

module Ember
  module Model
    module Source
      VERSION = JSON.load(File.read(
        File.expand_path('../../../../../package.json', __FILE__)))['version']
    end
  end
end
