# client node module tests
#
# Copyright (C) 2012 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

require 'spec_helper'

include Omega::Client

describe Omega::Client::CachedAttribute do
  before(:each) do
    @old = CachedAttribute::TIMEOUT
    CachedAttribute::TIMEOUT = 1

    $times_invoked = 0
    $te = TestEntity.new
    CachedAttribute.cache($te, :attr) { |ta|
      self.id.should == $te.id
      $times_invoked += 1
      ta + 1
    }
  end

  after(:each) do
    CachedAttribute::TIMEOUT = @old
  end

  it "should cache entity attribute" do
    $te.attr.should == 1
    $times_invoked.should == 1
    $te.attr.should == 1
    $times_invoked.should == 1
    
    sleep 1.1
    $te.attr.should == 2
    $times_invoked.should == 2
  end

  it "should be globally toggable" do
    CachedAttribute.enabled?.should == true
    CachedAttribute.enabled?(false)
    CachedAttribute.enabled?.should == false

    $te.attr.should == 0
    $times_invoked.should == 0

    CachedAttribute.enabled?(true)
    CachedAttribute.enabled?.should == true
  end

  # TODO test invalidation
  it "should permit entity attribute invalidation" do
    $te.attr.should == 1
    $times_invoked.should == 1
    $te.attr.should == 1
    $times_invoked.should == 1
    CachedAttribute.invalidate($te.id, :attr)
    $te.attr.should == 2
    $times_invoked.should == 2
  end

end

describe Omega::Client::Node do

  before(:each) do
    TestUser.add_role(:superadmin)
  end

  it "should accept rjr node to communicate with server" do
    @local_node = RJR::LocalNode.new :node_id => 'omega-test'
    Node.node = @local_node
    @local_node.message_headers['source_node'].should == 'omega-test'
    @local_node.message_headers['session_id'].should_not be_nil
  end

  it "should return logged in user" do
    @local_node = RJR::LocalNode.new :node_id => 'omega-test'
    Node.node = @local_node
    Node.user.id.should == TestUser.id
  end

  it "should allow entities to be set and retrieved" do
    te = TestEntity.new
    Node.set(te)
    Node.get(te.id).should == te
  end

  it "should allow client to select entities" do
    te = TestEntity.new
    Node.set(te)
    r = Node.select { |i,v| i == te.id }
    r.size.should == 1
    r.first.first.should == te.id
  end

  it "should cache entities by id" do
    invoked = 0
    te = TestEntity.new
    Node.cached(te.id) { |i|
      invoked += 1
      i.should == te.id
      te
    }.should == te
    Node.cached(te.id){ |i|
      invoked += 1
    }.should == te
    invoked.should == 1
  end

  it "should proxy server requests" do
    u = Node.invoke_request('users::get_entity', 'with_id', TestUser.id)
    u.class.should == Users::User
    u.id.should == TestUser.id
  end

  it "should handle server messages" do
    Node.clear_method_handlers!
    Node.has_method_handler_for?('motel::on_movement').should be_false
    RJR::Dispatcher.has_handler_for?('motel::on_movement').should be_false

    Node.add_method_handler('motel::on_movement')
    Node.has_method_handler_for?('motel::on_movement').should be_true
    RJR::Dispatcher.has_handler_for?('motel::on_movement').should be_true
  end

  it "should raise events for omega events corresponding to server messages" do
    invoked = false
    te = TestEntity.new
    te.location Motel::Location.new(:id => 424)
    Node.set(te)
    Node.add_method_handler('motel::on_movement')
    Node.add_event_handler(te.id, :movement) { |l|
      invoked = true
    }
    # XXX need to use a local node instance directly to prevent a deadlock
    # here (invoke_request locks node, and response will try to when setting result)
    Node.instance.instance_variable_get(:@node).invoke_request "motel::on_movement", te.location
    sleep 1
    invoked.should == true
  end

  it "should allow events to be raised and handled" do
    # test raise_event, add_event_handler
    invoked = false
    te = TestEntity.new
    Node.has_event_handler?(te.id, :foovent).should be_false
    Node.add_event_handler(te.id, :foovent) { |a,b|
      invoked = true
      a.should == te
      b.should == :foobar
    }
    Node.has_event_handler?(te.id, :foovent).should be_true
    Node.raise_event :foovent, te, :foobar
    sleep 0.1
    invoked.should be_true
  end

  it "should discard errors in event handler" do
    # test raise_event, add_event_handler
    invoked = false
    te = TestEntity.new
    Node.add_event_handler(te.id, :foovent) { |a,b|
      raise Exception, ("arg")
      invoked = true
    }
    lambda{
      Node.raise_event :foovent, te, :foobar
    }.should_not raise_error(Exception)
    sleep 0.1
    invoked.should be_false
  end

  it "should clear event handlers for specified entity" do
    invoked1 = false
    invoked2 = false
    invoked3 = false
    te1 = TestEntity.new
    te2 = TestEntity.new
    Node.add_event_handler(te1.id, :foovent) { |a,b|
      invoked1 = true
    }
    Node.add_event_handler(te1.id, :barvent) { |a,b|
      invoked2 = true
    }
    Node.add_event_handler(te2.id, :foovent) { |a,b|
      invoked3 = true
    }
    Node.has_event_handler?(te1.id, :foovent).should be_true
    Node.has_event_handler?(te1.id, :barvent).should be_true
    Node.has_event_handler?(te2.id, :foovent).should be_true
    Node.clear_event_handlers(te1.id, :foovent)
    Node.raise_event :foovent, te1, :foobar
    Node.raise_event :barvent, te1, :foobar
    Node.raise_event :foovent, te2, :foobar
    Node.has_event_handler?(te1.id, :foovent).should be_false
    Node.has_event_handler?(te1.id, :barvent).should be_true
    Node.has_event_handler?(te2.id, :foovent).should be_true
    sleep 0.1
    invoked1.should be_false
    invoked2.should be_true
    invoked3.should be_true
  end

  # TODO test set_result, id_from_event_args, convert_invoke_args ???
end