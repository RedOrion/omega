/* Omega Planet JS Representation
 *
 * Copyright (C) 2013 Mohammed Morsi <mo@morsi.org>
 *  Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt
 */

// TODO also load planet moons

Omega.Planet = function(parameters){
  this.color = '000000';
  this.components = [];
  this.shader_components = [];
  $.extend(this, parameters);
};

Omega.Planet.prototype = {
  json_class : 'Cosmos::Entities::Planet',

  load_gfx : function(config, event_cb){
    if(typeof(Omega.Planet.gfx) !== 'undefined') return;
    Omega.Planet.gfx = {};

    //// mesh
      // each planet instance should override radius in the geometry instance
      var radius   = 100, segments = 32, rings = 32;
      var mesh_geo = new THREE.SphereGeometry(radius, segments, rings);

      // each planet instance should set texture to that generated from planet color
      var material = this._load_material(config, event_cb);

      Omega.Planet.gfx.mesh = new THREE.Mesh(mesh_geo, material);

    //// orbit
      Omega.Planet.gfx.orbit_material = new THREE.LineBasicMaterial({color: 0xAAAAAA});
  },

  _load_material : function(config, event_cb){
    var colori  = parseInt(this.color) % 5;
    var texture = config.resources['planet' + colori].material;
    var path    = config.url_prefix + config.images_path + texture;
    var sphere_texture = THREE.ImageUtils.loadTexture(path, {}, event_cb);
    return new THREE.MeshLambertMaterial({map: sphere_texture});
  },

  // orbit calculated on the fly on a per-planet basis
  _calc_orbit : function(){
    if(!this.location || !this.location.movement_strategy){
      this.orbit = [];
      return;
    }
    var ms = this.location.movement_strategy;

    var intercepts = Omega.Math.intercepts(ms.e, ms.p)
    this.a  = intercepts[0]; this.b = intercepts[1];
    this.le = Omega.Math.le(this.a, this.b);
    var center = Omega.Math.center(ms.dmajx, ms.dmajy, ms.dmajz, this.le);
    this.cx = center[0]; this.cy = center[1]; this.cz = center[2];

    var nv = Omega.Math.cp(ms.dmajx, ms.dmajy, ms.dmajz,
                           ms.dminx, ms.dminy, ms.dminz);

    this.rot_plane = {};
    this.rot_plane.angle = Omega.Math.abwn(0, 0, 1, nv[0], nv[1], nv[2]);
    this.rot_plane.axis  = Omega.Math.cp(0, 0, 1, nv[0], nv[1], nv[2]);
    this.rot_plane.axis  = Omega.Math.nrml(this.rot_plane.axis[0],
                                           this.rot_plane.axis[1],
                                           this.rot_plane.axis[2]);

    var nmaj = Omega.Math.rot(1, 0, 0,
                              this.rot_plane.angle,
                              this.rot_plane.axis[0],
                              this.rot_plane.axis[1],
                              this.rot_plane.axis[2]);

    this.rot_axis = {};
    this.rot_axis.angle = Omega.Math.abwn(nmaj[0],  nmaj[1],  nmaj[2],
                                          ms.dmajx, ms.dmajy, ms.dmajz);
    this.rot_axis.axis = Omega.Math.cp(nmaj[0],  nmaj[1],  nmaj[2],
                                       ms.dmajx, ms.dmajy, ms.dmajz);
    this.rot_axis.axis = Omega.Math.nrml(this.rot_axis.axis[0],
                                         this.rot_axis.axis[1],
                                         this.rot_axis.axis[2]);

    this.orbit = Omega.Math.elliptical_path(ms);
  },

  _init_orbit_gfx : function(){
    this._calc_orbit();

    var orbit_geo = new THREE.Geometry();
    var first = null, last = null;
    for(var o = 1; o < this.orbit.length; o++){
      var orbit  = this.orbit[o];
      var orbitv = new THREE.Vector3(orbit[0], orbit[1], orbit[2]);
      last = orbitv;

      var porbit  = this.orbit[o-1];
      var porbitv = new THREE.Vector3(porbit[0], porbit[1], porbit[2]);
      if(first == null) first = porbitv;
        
      orbit_geo.vertices.push(orbitv);
      orbit_geo.vertices.push(porbitv);
    }

    orbit_geo.vertices.push(first);
    orbit_geo.vertices.push(last);

    var orbit_material = Omega.Planet.gfx.orbit_material.clone();
    this.orbit_mesh    = new THREE.Line(orbit_geo, orbit_material);
  },

  init_gfx : function(config, event_cb){
    if(this.components.length > 0) return; /// return if already initialized
    this.load_gfx(config, event_cb);

    this.mesh = Omega.Planet.gfx.mesh.clone();
    this.mesh.omega_entity = this;
    this.mesh.material = this._load_material(config, event_cb, '0x' + this.color);
    this.refresh_gfx();

    this._init_orbit_gfx();
    this.components = [this.mesh, this.orbit_mesh];
  },

  refresh_gfx : function(){
    if(this.location && this.mesh)
      this.mesh.position.set(this.location.x,
                             this.location.y,
                             this.location.z);
  },

  run_effects : function(){
    var ms   = this.location.movement_strategy;
    var curr = new Date();
    if(!this.last_moved){
      this.last_moved = curr;
      return;
    }

    var elapsed = curr - this.last_moved;
    var dist = ms.speed * elapsed / 1000;

    var n = Omega.Math.rot(this.location.x-this.cx,
                           this.location.y-this.cy,
                           this.location.z-this.cz,
                             - this.rot_axis.angle,
                             this.rot_axis.axis[0],
                             this.rot_axis.axis[1],
                             this.rot_axis.axis[2])

        n = Omega.Math.rot(n[0], n[1], n[2],
                        -this.rot_plane.angle,
                            this.rot_plane.axis[0],
                            this.rot_plane.axis[1],
                            this.rot_plane.axis[2]);

    var x = n[0] ; var y = n[1]; /// z should == 0

    // calc current angle (x = a*Math.cos(i))
    var angle = Math.acos(x/this.a)
    if(y < 0) angle = 2 * Math.PI - angle;

    // calculate new angle
    var new_angle = dist + angle;

    // calculate new position
    var x = this.a * Math.cos(new_angle);
    var y = this.b * Math.sin(new_angle);
    var n = Omega.Math.rot(x, y, 0,
                  this.rot_plane.angle,
                this.rot_plane.axis[0],
                this.rot_plane.axis[1],
                this.rot_plane.axis[2])


        n = Omega.Math.rot(n[0], n[1], n[2], 
                        this.rot_axis.angle,
                      this.rot_axis.axis[0],
                      this.rot_axis.axis[1],
                      this.rot_axis.axis[2]);

    this.location.x = n[0] + this.cx;
    this.location.y = n[1] + this.cy;
    this.location.z = n[2] + this.cz;

    this.refresh_gfx();
    this.last_moved = curr;
  }
};
