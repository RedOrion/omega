# Cosmos Galaxy definition
#
# Copyright (C) 2010 Mohammed Morsi <movitto@yahoo.com>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

module Cosmos
class Galaxy
  # maximum size of the galaxy in any given direction from center
  MAX_SIZE = 325

  attr_reader :name
  attr_reader :size
  attr_reader :location
  attr_reader :solar_systems

  def initialize(args = {})
    @name          = args['name']          || args[:name]
    @location      = args['location']      || args[:location]
    @size          = args['size']          || args[:size] || MAX_SIZE # TODO generate random size from MAX?
    @solar_systems = args['solar_systems'] || []

    if @location.nil?
      @location = Motel::Location.new
      @location.x = @location.y = @location.z = 0
    end
  end

  def add_child(solar_system)
    # TODO rails exception unless solar_system.is_a? SolarSystem
    @solar_systems << solar_system
  end

   def to_json(*a)
     {
       'json_class' => self.class.name,
       'data'       =>
         {:name => @name, :size => @size, :location => @location, :solar_systems => @solar_systems}
     }.to_json(*a)
   end

   def self.json_create(o)
     galaxy = new(o['data'])
     return galaxy
   end
end
end