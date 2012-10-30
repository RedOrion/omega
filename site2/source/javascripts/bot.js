function clear_timers(){
  for(var timer in $timers){
    $timers[timer].stop();
    delete $timers[timer];
  }
  $timers = [];
}

function set_root_entity(entity_id){
  var entity = $tracker.entities[entity_id];
  hide_entity_container();
  $('#omega_canvas').css('background', 'url("/womega/images/backgrounds/' + entity.background + '.png") no-repeat');

  // cancel all event tracking
  clear_timers();
  clear_method_handlers();
  var tracking_location = false;
  $tracked_planets = [];

  for(var child in entity.children){
    child = entity.children[child];
    // remove & resetup callbacks
    if(child.is_a("Manufactured::Ship")){
      omega_ws_request('motel::remove_callbacks', child.location.id, null);
      if(child.belongs_to_user)
        omega_ws_request('manufactured::remove_callbacks', child.id, null);

      tracking_location = true;
      omega_ws_request('motel::track_movement', child.location.id, 20, null);
      // TODO track attack/defend and mining events

    }else if(child.is_a("Cosmos::Planet")){
      $tracked_planets.push(child);
      omega_ws_request('motel::remove_callbacks', child.location.id, null);

      tracking_location = true;
      omega_ws_request('motel::track_movement', child.location.id, 120, null);
    }

    $scene.add(child);
  }

  if(tracking_location){
    add_method_handler('motel::on_movement', function(loc){
      var entity = $tracker.matching_entities({location : loc.id});
      entity[0].update({location : loc});
      $scene.animate();
    });
  }

  if($tracked_planets.length > 0){
    // create a timer to periodically update planet location inbetween server syncronizations
    $timers['planet_movement'] = $.timer(function(){
      for(var planet in $tracked_planets){
        planet = $tracked_planets[planet];
        planet.move();
        $scene.animate();
      }
    });
    $timers['planet_movement'].set({time : 2000, autostart : true });
  }

  $scene.animate();
}

function callback_got_system(system, error){
  if(error == null){
    if(!system.modified){ // if adding system for the first time
      $('#locations_list ul').append('<li name="'+system.name+'"> -> '+system.name+'</li>');
      $('#locations_list').show();

      if(system.star != null) $tracker.add(system.star);
      for(var a in system.asteroids) $tracker.add(system.asteroids[a]);
      for(var p in system.planets){
        p = system.planets[p];
        $tracker.add(p);
        for(var m in p.moons)
          $tracker.add(p.moons[m]);
      }
      for(var j in system.jump_gates){
        j = system.jump_gates[j];
        j.id = j.solar_system + "-" + j.endpoint;
        $tracker.add(j)
      }

      system.update_children();
    }
  }
}

function callback_got_manufactured_entities(entities, error){
  if(error == null){
    for(var entityI in entities){
      var entity = entities[entityI];
      $tracker.add(entity);
      $tracker.load('Cosmos::SolarSystem', entity.system_name, callback_got_system);
    }
  }
}

function get_manufactured_entities(user, error){
  if(error == null){
    var user_id = (user.json_class == 'Users::User' ? user.id : user.user_id);
    omega_web_request('manufactured::get_entities', 'owned_by', user_id, callback_got_manufactured_entities);
  }
}
$(document).ready(function(){ 
  $timers = {};
  $validate_session_callbacks.push(get_manufactured_entities);
  $login_callbacks.push(get_manufactured_entities);

  $('#locations_list li').live('click', function(event){ 
    var entity_id = $(event.currentTarget).attr('name');
    set_root_entity(entity_id);
  });
});
