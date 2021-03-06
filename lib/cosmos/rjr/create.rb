# cosmos::create_entity rjr definition
#
# Copyright (C) 2013 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

require 'cosmos/rjr/init'

module Cosmos::RJR
# create specified cosmos entity
create_entity = proc { |entity|
  # require create cosmos entities
  require_privilege :registry  => user_registry,
                    :privilege => 'create',
                    :entity    => 'cosmos_entities'

  # ensure cosmos entity specified
  raise ValidationError,
        entity unless Cosmos::Registry::VALID_TYPES.include?(entity.class)

  # sanitize received location
  entity.location.restrict_view = false
  entity.location.id = entity.id

  # need to set entity's location's parent_id to entity's parent's location id
  entity.location.parent =
    registry.entity(&with_id(entity.parent_id)).location if entity.parent_id

  # ensure entity is valid
  raise ValidationError, entity unless entity.valid?

  # create location
  begin
    entity.location = node.invoke('motel::create_location', entity.location)
  rescue Exception => e
    raise OperationError, "#{entity.location} not created"
  end

  # add entity to registry, throw error if not added
  added = registry << entity
  # TODO delete location if not added
  raise OperationError, "#{entity} not created" if !added

  # return entity
  entity
}

CREATE_METHODS = { :create_entity => create_entity }
end

def dispatch_cosmos_rjr_create(dispatcher)
  m = Cosmos::RJR::CREATE_METHODS
  dispatcher.handle 'cosmos::create_entity', &m[:create_entity]
end
