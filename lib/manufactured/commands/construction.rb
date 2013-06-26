# Manufactured construction command definition
#
# Copyright (C) 2013 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

require 'time'

require 'rjr/common'
require 'omega/server/command'

module Manufactured
module Commands

# Represents action of one {Manufactured::Station} constructing another
# manufactured entity.
#
# Checking of resources & the actual construction (eg call to station.construct)
# should be done prior to invoking this, this will simulate a construction delay
# for a parameterized durition invoking the registered callbacks on the way.
# (TODO we may want to revisit this at some point)
#
# Invokes various Manufactured::Callback handlers upon various events.
# The callback events/types invoked include:
# * 'partial_construction'   - invoked upon every iteration of the construction cycle w/ the given fraction of construction completed
# * 'construction_complete'  - invoked when construction is fully completed
class Construction < Omega::Server::Command
  include Omega::Server::CommandHelpers

  # Station {Manufactured::Station} station
  attr_accessor :station

  # {Manufactured::Entity entity} constructed
  attr_accessor :entity

  # Bool indicating if construction is completed
  attr_accessor :completed

  # Time construction was started
  attr_accessor :start_time

  # Return the unique id of this construction command.
  def id
    sid = @station.nil? ? "" : @station.id
    eid = @entity.nil? ? "" : @entity.id
    "#{sid}-#{eid}"
  end

  # Manufactured::Commands::Construction initializer
  #
  # @param [Hash] args hash of options to initialize mining command with
  # @option args [Manufactured::Station] :station constructing station
  # @option args [Manufactured::Entity] :entity entity constructe
  def initialize(args = {})
    attr_from_args args, :station   => nil,
                         :entity    => nil,
                         :completed => false,
                         :start_time => nil
    @start_time = Time.parse(@start_time) if @start_time.is_a?(String)
    super(args)
  end

  # Update command from another
  def update(cmd)
    update_from(cmd, :start_time, :completed)
  end

  def after_hook
    # persist cmd to registry
    update_registry(self)
  end

  def should_run?
    super && !self.completed
  end

  def run!
    ::RJR::Logger.debug "invoking construction cycle #{@station.id} -> #{@entity.id}"
    super

    t = Time.now
    @start_time ||= Time.now
    const_time = @entity.class.construction_time(@entity.type)
    total_time = t - @start_time

    self.completed = (total_time >= const_time)

    if self.completed
      run_callbacks @station, 'construction_complete', @entity

    else
      percentage = total_time / const_time
      run_callbacks @station, 'partial_construction', @entity, percentage
    end
  end

  def remove?
    # remove if completed
    self.completed
  end

   # Convert command to json representation and return it
   def to_json(*a)
     {
       'json_class' => self.class.name,
       'data'       =>
         {:station => station,
          :entity  => entity,
          :completed => completed,
          :start_time => start_time}.merge(cmd_json)
     }.to_json(*a)
   end

end # class Construction
end # module Commands
end # module Omega
