# Cosmos remote cosmos tracking operations
#
# Copyright (C) 2012 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

# TODO provide mechanism which to create necessary permissions
#      to invoke operations on remote queue

require 'thread'

module Cosmos

class RemoteCosmosManager
  def initialize
    @nodes = {}
    @lock  = Mutex.new
  end

  def remote_node_for(queue)
    unless @nodes.has_key?(queue)
      # FIXME lookup which broker is running queue & user credentials to use
      #       (intially via config file, but later via service)
      broker = 'localhost'
      user = Users::User.new :id => 'rcm', :password => 'mcr'

      node_id = Motel.gen_uuid
      @nodes[queue] = RJR::AMQPNode.new :broker => broker, :node_id => "motel-remote-#{node_id}"
      #@nodes[queue].listen

      # TODO incorporate a rjr timeout?
      session = @nodes[queue].invoke_request(queue, 'users::login', user)
      @nodes[queue].message_headers['session_id'] = session.id
    end

    @nodes[queue]
  end

  def get_entity(entity)
    @lock.synchronize{
      entity_type = entity.class.to_s.downcase.underscore.split('/').last.intern
      node = remote_node_for(entity.remote_queue)
      return node.invoke_request(entity.remote_queue, 'cosmos::get_entity', entity_type, entity.name)
    }
  end

  def create_entity(entity, parent_name)
    @lock.synchronize{
      trq = entity.remote_queue
      entity.remote_queue = nil

      node = remote_node_for(trq)
      node.invoke_request(trq, 'cosmos::create_entity', entity, parent_name)

      entity.remote_queue = trq
    }
  end

  def set_resource(entity, resource, quantity)
  end

  def get_resources(entity)
  end

  def get_resource_source(resource_source)
  end

end
end