/* Omega Javascript Commands
 *
 * Supports operations around entities as defined in entities.js.
 *
 * Entities will be loaded from the Entities() registry and a
 * valid node should be set there to invoke remote methods and
 * setup request callbacks.
 *
 * Copyright (C) 2013 Mohammed Morsi <mo@morsi.org>
 *  Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt
 */

// TODO register audio effects for various server and ui events
// (attacking, mining, construction, jump, selection, etc)

/* Server Event Tracker
 *
 * Implements the singleton pattern
 */
function ServerEvents(){
  if ( ServerEvents._singletonInstance )
    return ServerEvents._singletonInstance;
  var _this = {};
  ServerEvents._singletonInstance = _this;

  $.extend(_this, new EventTracker());

  _this.callbacks = {};

  /* register a callback to handle the specified server event,
   * reraising it on the local object when it occurs
   */
  _this.handle = function(server_event){
    if($.isArray(server_event)){
      for(var e = 0; e < server_event.length; e++)
        _this.handle(server_event[e]);
      return;
    }

    _this.callbacks[server_event] = function(){
      // Create a new array from the contents of arguments
      var nargs = [server_event].concat(args_to_arry(arguments));
      _this.raise_event.apply(_this, nargs);

      // also attempt to identify the 'primary' object which
      // the event is occurring on and raise it there
      for(var a in arguments){
        var arg = arguments[a];
        if(arg.id){
          // XXX
          var id = ((arg.json_class == 'Motel::Location') ?
                    ('location-' + arg.id) : arg.id);
          var entity = Entities().get(id)
          if(entity != null){
            entity.raise_event.apply(entity, nargs);
            break;
          }
        }
      }
    }

    Entities().node().clear_handlers(server_event);
    Entities().node().add_handler(server_event, _this.callbacks[server_event]);
  }

  /* clear callback registered for event
   */
  _this.clear = function(server_event){
    Entities().node().clear_handlers(server_event);
    if(server_event)
      _this.callbacks[server_event] = null;
    else
      _this.callbacks = {};
  }

  return _this;
}

/////////////////////////////////////// Events Namespace

var Events = {

  /////////////////////////////////////// Movement Event

  /* Motel Location movement
   */
  track_movement : function(location_id, distance, rot_distance){
    // handle server events
    ServerEvents().handle(['motel::changed_strategy',
                           'motel::location_stopped',
                           'motel::on_movement',
                           'motel::on_rotation']);

    // subscribe to server notifications
    Entities().node().ws_request('motel::track_strategy', location_id);
    Entities().node().ws_request('motel::track_stops', location_id);
    Entities().node().ws_request('motel::track_movement', location_id, distance);

    if(rot_distance)
      Entities().node().ws_request('motel::track_rotation', location_id, rot_distance);
  },

  /////////////////////////////////////// Stop tracking movement

  /* Stop tracking motel location movement
   */
  stop_track_movement : function(location_id){
    Entities().node().ws_request('motel::remove_callbacks', location_id);
  },

  /////////////////////////////////////// Mining Events

  /* Manufactured Ship mining events
   */
  track_mining : function(ship_id){
    // handle server events
    ServerEvents().handle('manufactured::event_occurred');

    // subscribe to server notification
    Entities().node().ws_request('manufactured::subscribe_to', ship_id, 'resource_collected');
    Entities().node().ws_request('manufactured::subscribe_to', ship_id, 'mining_stopped');
  },

  /////////////////////////////////////// Attacked Events

  /* Manufactured Ship offensive events
   */
  track_offense : function(ship_id){
    // handle server events
    ServerEvents().handle('manufactured::event_occurred');

    Entities().node().ws_request('manufactured::subscribe_to', ship_id, 'attacked');
    Entities().node().ws_request('manufactured::subscribe_to', ship_id, 'attacked_stop');
  },

  /////////////////////////////////////// Defended Events

  /* Manufactured Ship defense events
   */
  track_defense : function(ship_id){
    // handle server events
    ServerEvents().handle('manufactured::event_occurred');

    Entities().node().ws_request('manufactured::subscribe_to', ship_id, 'defended');
    Entities().node().ws_request('manufactured::subscribe_to', ship_id, 'defended_stop');
    Entities().node().ws_request('manufactured::subscribe_to', ship_id, 'destroyed_by');
  },

  /////////////////////////////////////// Construction Events

  /* Manufactured Station construction events
   */
  track_construction : function(station_id){
    // handle server events
    ServerEvents().handle('manufactured::event_occurred');

    Entities().node().ws_request('manufactured::subscribe_to', station_id, 'construction_complete');
    Entities().node().ws_request('manufactured::subscribe_to', station_id, 'partial_construction');
  },

  /////////////////////////////////////// Stop tracking manufactured events

  /* Stop tracking  manufactured events
   */
  stop_track_manufactured : function(entity_id){
    Entities().node().ws_request('manufactured::remove_callbacks', entity_id);
  }

}

/////////////////////////////////////// Commands Namespace

var Commands = {

  /////////////////////////////////////// Trigger Jump Gate Command

  /* Detect ships around jump gate and
   * invoke jump operation on them
   *
   * @param {Cosmos::Entities::JumpGate} jg jump gate to trigger
   * @param {Callable} cb optional callback to invoke after jump gate is triggered
   */
  trigger_jump_gate : function(jg, cb){
    // move entities within triggering distance of gate
    var entities = Entities().select(function(e) { return e.json_class == "Manufactured::Ship" &&
                                                          e.user_id    == Session.current_session.user_id       &&
                                                          e.location.is_within(jg.trigger_distance, jg.location); });

    // we are assuming endpoint system is loaded from server
    //   (we do this in the clicked jump gate callback)
    var endpoint = jg.endpoint_system;
    for(var entityi = 0; entityi < entities.length; entityi++){
      entity = entities[entityi];
      Commands.jump_ship(entity, endpoint);
      jg.raise_event('triggered', entity);
    }

    // XXX might be invoked before all jump_ship commands return results
    if(cb)
      cb.apply(null, [jg, entities]);

  },

  /////////////////////////////////////// Jump Ship Command

  /* Invoke omega server side manufactured::move_entity
   * operation to move ship inbetween systems
   *
   * @param {Manufactured::Ship} ship to jump
   * @param {Cosmos::Entities::SolarSystem} sys system to jump to
   */
  jump_ship : function(ship, sys){
    var old_sys = ship.solar_system;
    ship.location.parent_id = sys.location.id;
    Entities().node().web_request('manufactured::move_entity', ship.id, ship.location, function(res){
      if(!res.error){
        ship.system_id  = sys.id;
        ship.solar_system = sys
        ship.raise_event('jumped', old_sys, sys);
      }
    });
  },

  /////////////////////////////////////// Move Ship Command

  /* Invoke omega server side manufactured::move_entity
   * operation to move ship in a system
   *
   * @param {Manufactured::Ship} ship ship to move
   * @param {Float} x x coordinate to move ship to
   * @param {Float} y y coordinate to move ship to
   * @param {Float} z z coordinate to move ship to
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  move_ship : function(ship, x, y, z, cb){
    var loc = ship.location.clone();
    loc.x = x; loc.y = y; loc.z = z;

    if(cb == null) cb = function(res){};
    Entities().node().web_request('manufactured::move_entity', ship.id, loc, cb);
  },

  /////////////////////////////////////// Launch Attack Command

  /* Invoke omega server side manufactured::attack_entity
   * operation to attack specified entity
   *
   * @param {Manufactured::Ship} attacker ship to launch attack with
   * @param {Manufactured::Ship} defender ship to attack
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  launch_attack : function(attacker, defender, cb){
    if(cb == null) cb = function(res){};
    Entities().node().web_request('manufactured::attack_entity',
                                      attacker.id, defender.id, cb);
  },

  /////////////////////////////////////// Dock Ship Command

  /* Invoke omega server side manufactured::dock
   * operation to dock the ship at the specified station
   *
   * @param {Manufactured::Ship} ship ship to dock
   * @param {Manufactured::Station} station station to dock to
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  dock_ship : function(ship, station, cb){
    if(cb == null) cb = function(res){};
    Entities().node().web_request('manufactured::dock', ship.id, station.id, cb);
  },

  /////////////////////////////////////// Undock Ship Command

  /* Invoke omega server side manufactured::undock
   * operation to undock the specified ship
   *
   * @param {Manufactured::Ship} ship ship to undock
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  undock_ship : function(ship, cb){
    if(cb == null) cb = function(res){};
    Entities().node().web_request('manufactured::undock', ship.id, cb);
  },

  /////////////////////////////////////// Transfer Resources Command

  /* Invoke omega server side manufactured::transfer_resource
   * operation to transfer all resources for the specified ship
   * to the specified station
   *
   * @param {Manufactured::Ship} ship ship to transfer resources from
   * @param {Manufactured::Station} station station to transfer resources to
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  transfer_resources : function(ship, station_id, cb){
    if(cb == null) cb = function(res){};
    for(var r = 0; r < ship.resources.length; r++){
      var res = new JRObject('Cosmos::Resource', ship.resources[r]);
      Entities().node().web_request('manufactured::transfer_resource',
                                    ship.id, station_id, res, cb);
    }
  },

  /////////////////////////////////////// Start Mining Command

  /* Invoke omega server side manufactured::start_mining
   * operation to start mining the specified resource using
   * the specified ship
   *
   * @param {Manufactured::Ship} ship ship to use to start mining
   * @param {String} resource_id id of the resource to starting mining
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  start_mining : function(ship, resource_id, cb){
    if(cb == null) cb = function(res){};
    Entities().node().web_request('manufactured::start_mining',
                            ship.id, resource_id, cb);
  },

  /////////////////////////////////////// Construct Entity Command

  /* Invoke omega server side manufactured::construct
   * operation to construct entity using the specified station
   *
   * TODO support other entity types/params!
   *
   * @param {Manufactured::Station} station station to use to construct entity
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  construct_entity : function(station, cb){
    if(cb == null) cb = function(res){};
    Entities().node().web_request('manufactured::construct_entity',
                                  station.id,
                                  'entity_type', 'Ship',
                                  'type', 'mining',
                                  'id', guid(), // generate new id
                                  cb);
  },

  /////////////////////////////////////// Assign Mission Command

  /* Invoke omega server side missions::assign_mission
   * operation to assign the specified mission to the specified user
   *
   * @param {String} mission_id id of mission to assign to the user
   * @param {String} user_id id of user to assign the mission to
   * @param [Callable] cb optional callback to invoke upon request returning
   */
  assign_mission : function(mission_id, user_id, cb){
    if(cb == null) cb = function(res){};
    Entities().node().web_request('missions::assign_mission', mission_id, user_id, cb);
  },
}
