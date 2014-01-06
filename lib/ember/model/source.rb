require "ember/model/source/version"
require "rails"

module Ember
  module Model
    module Source
      class Engine < ::Rails::Engine
        config.assets.paths << File.expand_path('../../../../', __FILE__)
      end
    end
  end
end
