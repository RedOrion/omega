# Station module tests
#
# Copyright (C) 2012 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

require File.dirname(__FILE__) + '/../spec_helper'

describe Manufactured::Station do

  it "should successfully accept and set station params" do
     type = Manufactured::Station::STATION_TYPES.first
     size = Manufactured::Station::STATION_SIZES[type]

     station = Manufactured::Station.new :id => 'station1', :user_id => 5,
                                   :type => type.to_s, :size => size,
                                   :solar_system => 'system1'
                                   
     station.id.should == 'station1'
     station.user_id.should == 5
     station.location.should_not be_nil
     station.location.x.should == 0
     station.location.y.should == 0
     station.location.z.should == 0
     station.type.should == type
     station.size.should == size

     station.parent.should == 'system1'
     station.parent = 'system2'
     station.parent.should == 'system2'
  end

  it "should permit storing resources locally" do
    station   = Manufactured::Station.new :id => 'station1'
    station.resources.should be_empty

    res = Cosmos::Resource.new :name => 'titanium', :type => 'metal'
    station.add_resource res, 50
    station.resources.should_not be_empty
    station.resources.size.should == 1
    station.resources[res.id].should == 50

    station.add_resource res, 60
    station.resources.size.should == 1
    station.resources[res.id].should == 110

    station.remove_resource res, 40
    station.resources.size.should == 1
    station.resources[res.id].should == 70

    station.remove_resource res, 70
    station.resources.size.should == 1
    station.resources[res.id].should == 0
  end

  it "should permit constructing new entities" do
    station   = Manufactured::Station.new :id => 'station1',
                                          :solar_system => 'system1'

    entity   = station.construct :entity_type => 'foobar'
    entity.should be_nil

    entity   = station.construct :entity_type => "Manufactured::Ship"
    entity.class.should == Manufactured::Ship
    entity.parent.should == station.parent
    entity.location.should_not be_nil

    entity   = station.construct :entity_type => "Manufactured::Station"
    entity.class.should == Manufactured::Station
    entity.parent.should == station.parent
    entity.location.should_not be_nil
  end

  it "should be convertable to json" do
    system1 = Cosmos::SolarSystem.new :name => 'system1'
    location= Motel::Location.new :id => 20, :y => -15
    s = Manufactured::Station.new(:id => 'station42', :user_id => 420,
                               :type => :science, :size => 50, 
                               :solar_system => system1,
                               :location => location)

    j = s.to_json
    j.should include('"json_class":"Manufactured::Station"')
    j.should include('"id":"station42"')
    j.should include('"user_id":420')
    j.should include('"type":"science"')
    j.should include('"size":50')
    j.should include('"json_class":"Motel::Location"')
    j.should include('"id":20')
    j.should include('"y":-15')
    j.should include('"json_class":"Cosmos::SolarSystem"')
    j.should include('"name":"system1"')
  end

  it "should be convertable from json" do
    j = '{"data":{"type":"science","user_id":420,"solar_system":{"data":{"star":null,"planets":[],"jump_gates":[],"name":"system1","background":"system1","location":{"data":{"restrict_modify":true,"movement_strategy":{"data":{"step_delay":1},"json_class":"Motel::MovementStrategies::Stopped"},"remote_queue":null,"parent_id":null,"x":0,"y":0,"z":0,"id":null,"restrict_view":true},"json_class":"Motel::Location"}},"json_class":"Cosmos::SolarSystem"},"size":50,"id":"station42","location":{"data":{"restrict_modify":true,"movement_strategy":{"data":{"step_delay":1},"json_class":"Motel::MovementStrategies::Stopped"},"remote_queue":null,"parent_id":null,"x":null,"y":-15,"z":null,"id":20,"restrict_view":true},"json_class":"Motel::Location"}},"json_class":"Manufactured::Station"}'
    s = JSON.parse(j)

    s.class.should == Manufactured::Station
    s.id.should == "station42"
    s.user_id.should == 420
    s.type.should == :science
    s.size.should == 50
    s.location.should_not be_nil
    s.location.y.should == -15
    s.solar_system.should_not be_nil
    s.solar_system.name.should == 'system1'
  end

end