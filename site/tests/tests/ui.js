pavlov.specify("UIComponent", function(){
describe("UIComponent", function(){
  var c;
  before(function(){
    $('#qunit-fixture').
      append('<div id="component_id"></div><div id="close_control"></div><div id="toggle_control"></div>')
    c = new UIComponent();
    c.div_id = '#component_id'
    c.close_control_id = '#close_control'
    c.toggle_control_id = '#toggle_control'
  });

  describe("#on", function(){
    it("listens for event on page component", function(){
      var cc = c.component();
      var spy = sinon.spy(cc, 'live')
      c.on('click', function(){})
      sinon.assert.calledWith(spy, 'click')
      // TODO test other events
    })

    it("reraises page component event on self", function(){
      var cc = c.component();
      var spy = sinon.spy(c, 'raise_event')
      c.on('click', function(){})
      cc.trigger('click')
      sinon.assert.calledWith(spy, 'click')
    })
  })

  describe("#component", function(){
    it("returns handle to page component", function(){
      var cc = c.component();
      assert(cc.selector).equals('#component_id')
    })
  })

  describe("#append", function(){
    it("appends specified content to page component", function(){
      c.append("foobar")
      assert($('#component_id').html().slice(-6)).equals("foobar")
    })
  })

  describe("#close control", function(){
    it("returns handle to close-page-component control", function(){
      var cc = c.close_control()
      assert(cc.selector).equals("#close_control")
    })
  })

  describe("#toggle control", function(){
    it("returns handle to toggle-page-component control", function(){
      var tc = c.toggle_control()
      assert(tc.selector).equals("#toggle_control")
    })
  })

  describe("#show", function(){
    before(function(){
      c.subcomponents.push(new UIComponent());
    })

    it("sets toggle control", function(){
      var tc = c.toggle_control();
      var spy = sinon.spy(tc, 'attr')
      c.show();
      sinon.assert.calledWith(spy, 'checked', true)
    });

    it("shows page component", function(){
      var cc = c.component();
      var spy = sinon.spy(cc, 'show')
      c.show();
      sinon.assert.called(spy);
    });

    it("shows subcomponents", function(){
      var spy = sinon.spy(c.subcomponents[0], 'show');
      c.show();
      sinon.assert.called(spy)
    });

    it("raises show event", function(){
      var spy = sinon.spy(c, 'raise_event');
      c.show();
      sinon.assert.calledWith(spy, 'show')
    })
  })

  describe("#hide", function(){

    before(function(){
      c.subcomponents.push(new UIComponent());
    })

    it("sets toggle control", function(){
      var tc = c.toggle_control();
      var spy = sinon.spy(tc, 'attr')
      c.hide();
      sinon.assert.calledWith(spy, 'checked', false)
    });

    it("hides page component", function(){
      var cc = c.component();
      var spy = sinon.spy(cc, 'hide')
      c.hide();
      sinon.assert.called(spy);
    });

    it("hides subcomponents", function(){
      var spy = sinon.spy(c.subcomponents[0], 'hide');
      c.hide();
      sinon.assert.called(spy)
    });

    it("raises hides event", function(){
      var spy = sinon.spy(c, 'raise_event');
      c.hide();
      sinon.assert.calledWith(spy, 'hide')
    })
  })

  describe("#visible", function(){
    describe("component is visible", function(){
      it("returns false", function(){
        c.hide();
        assert(c.visible()).isFalse();
      });
    })

    describe("component is not visible", function(){
      it("returns true", function(){
        c.show();
        assert(c.visible()).isTrue();
      });
    })
  })

  describe("#toggle", function(){
    it("inverts toggled flag", function(){
      var o = c.toggled;
      c.toggled = false;
      c.toggle()
      assert(c.toggled).equals(true)
      c.toggle()
      assert(c.toggled).equals(false)
    })

    describe("toggled", function(){
      it("shows component", function(){
        var spy = sinon.spy(c, 'show')
        c.toggled = false;
        c.toggle();
        sinon.assert.called(spy);
      })
    });

    describe("not toggled", function(){
      it("hides component", function(){
        var spy = sinon.spy(c, 'hide')
        c.toggled = true;
        c.toggle();
        sinon.assert.called(spy);
      })
    });

    it("raises toggled event", function(){
      var spy = sinon.spy(c, 'raise_event')
      c.toggle();
      sinon.assert.calledWith(spy, 'toggle');
    })
  });

  describe("set size", function(){
    it("sets component height", function(){
      var spy = sinon.spy(c.component(), 'height')
      c.set_size(100, 200);
      sinon.assert.calledWith(spy, 200);
    })

    it("sets component width", function(){
      var spy = sinon.spy(c.component(), 'width')
      c.set_size(100, 200);
      sinon.assert.calledWith(spy, 100);
    })

    it("triggers component resize", function(){
      var spy = sinon.spy(c.component(), 'trigger')
      c.set_size(100, 200);
      sinon.assert.calledWith(spy, 'resize');
    })
  });

  describe("#click_coords", function(){
    it('returns component coordinates where page click occurred', function(){
      var ostub = sinon.stub(c.component(), 'offset').returns({left : 10, top : 20})
      c.set_size(100, 200);

      assert(c.click_coords(10,   20)[0]).close(   -1, 0.00001);
      assert(c.click_coords(10,   20)[1]).close(    1, 0.00001);
      assert(c.click_coords(11,   21)[0]).close(-0.98, 0.00001);
      assert(c.click_coords(11,   21)[1]).close( 0.99, 0.00001);
      assert(c.click_coords(20,   30)[0]).close( -0.8, 0.00001);
      assert(c.click_coords(20,   30)[1]).close(  0.9, 0.00001);
      assert(c.click_coords(110, 220)[0]).close(    1, 0.00001);
      assert(c.click_coords(110, 220)[1]).close(   -1, 0.00001);
    });
  })

  describe('#lock', function(){
    var spy;

    before(function(){
      spy = sinon.spy(c.component(), 'css');
    })

    it('sets component to use absolute positioning', function(){
      c.lock([]);
      sinon.assert.calledWith(spy, {position: 'absolute'})
    })

    it('locks components to the top side', function(){
      c.lock(['top']);
      sinon.assert.calledWith(spy, {top: c.component().position.top});
    })

    it('locks components to the left side', function(){
      c.lock(['left']);
      sinon.assert.calledWith(spy, {left: c.component().position.left});
    })

    it('locks components to the right side', function(){
      c.lock(['right']);
      sinon.assert.calledWith(spy, {right: sinon.match.number});
    })
  })

  describe("#wire_up", function(){
    it("removes close control live event handlers", function(){
      var spy = sinon.spy(c.close_control(), 'die')
      c.wire_up();
      sinon.assert.called(spy);
    })

    it("removes toggle control live event handlers", function(){
      var spy = sinon.spy(c.toggle_control(), 'die')
      c.wire_up();
      sinon.assert.called(spy);
    })

    it("adds close control click event handler", function(){
      var spy = sinon.spy(c.close_control(), 'live')
      c.wire_up();
      sinon.assert.calledWith(spy, 'click');
    })

    describe("close control clicked", function(){
      it("hides component", function(){
        var spy = sinon.spy(c.close_control(), 'live')
        c.wire_up();
        var cb = spy.getCall(0).args[1];
        var spy = sinon.spy(c, 'hide');
        cb.apply(null, []);
        sinon.assert.called(spy);
      })
    });

    it("adds toggled control click event handler", function(){
      var spy = sinon.spy(c.toggle_control(), 'live')
      c.wire_up();
      sinon.assert.calledWith(spy, 'click');
    })

    describe("toggle control clicked", function(){
      it("toggles component", function(){
        var spy = sinon.spy(c.toggle_control(), 'live')
        c.wire_up();
        var cb = spy.getCall(0).args[1];
        var spy = sinon.spy(c, 'toggle');
        cb.apply(null, []);
        sinon.assert.called(spy);
      })
    });

    it("sets toggled false", function(){
      c.wire_up();
      assert(c.toggled).isFalse();
    })

    it("toggles component", function(){
      var spy = sinon.spy(c, 'toggle');
      c.wire_up();
      sinon.assert.called(spy);
    })
  })

});}); // UIComponent

pavlov.specify("UIListComponent", function(){
describe("UIListComponent", function(){
  var lc;

  before(function(){
    $('#qunit-fixture').append('<div id="component_id"></div>')

    lc = new UIListComponent();
    lc.div_id = '#component_id';
  });

  describe("#clear", function(){
    it("clears item list", function(){
      lc.items.push("foobar")
      lc.clear();
      assert(lc.items).empty();
    });
  })

  describe("#add_item", function(){
    it("adds array of items to items list", function(){
      lc.add_item([{ id : 'a' }, { id : 'b'}])
      assert(lc.items).includes({ id : 'a' })
      assert(lc.items).includes({ id : 'b' })
    });

    it("adds item to items list", function(){
      lc.add_item({ id : 'a' })
      assert(lc.items).includes({ id : 'a' })
    });

    it("wires up click_item event", function(){
      var spy = sinon.spy();
      lc.on('click_item', spy)
      var item = { id : 'a' }
      $('#qunit-fixture').append('<div id="a"></div>')
      lc.add_item(item);
      $('#a').trigger('click');
      sinon.assert.calledWith(spy, lc, item)
    });

    describe("existing item with same id", function(){
      it("overwrites old item", function(){
        lc.add_item({ id : 'a' })
        assert(lc.items[0]).isSameAs({ id : 'a' })
      });
    });
    
    //it("wires up item click handler")
    describe("item click", function(){
      it("raises click_item event on component", function(){
        var spy = sinon.spy(lc, 'raise_event')
        lc.add_item({ id : 'a' })
        $('#a').trigger('click');
        sinon.assert.calledWith(spy, 'click_item', { id : 'a' });
      })
    });

    it("refreshes the component", function(){
      var spy = sinon.spy(lc, 'refresh');
      lc.add_item({ id : 'a' })
      sinon.assert.called(spy);
    })
  })

  describe("#refresh", function(){
    it("invokes sort function to sort items", function(){
      var spy = sinon.spy();
      lc.sort = spy;
      lc.add_item({ id : 'a' })
      lc.add_item({ id : 'b' })
      lc.refresh();
      sinon.assert.called(spy);
    })

    it("renders item in component", function(){
      lc.add_item({ id : 'a', text : 'at' })
      lc.add_item({ id : 'b', text : 'bt' })
      lc.refresh();
      assert($(lc.div_id).html()).equals('<span id="a">at</span><span id="b">bt</span>')
    })

    //it("picks up alternative item wrapper")
  })

  describe("#add_text", function(){
    it("adds new item w/ specified text", function(){
      var spy = sinon.spy(lc, 'add_item');
      lc.add_text("fooz")
      sinon.assert.calledWith(spy, {id : 1, text : 'fooz', item : null})
    })

    it("adds items generated from an array of text", function(){
      var spy = sinon.spy(lc, 'add_item');
      lc.add_text(["foo", "bar"])
      sinon.assert.calledWith(spy, {id : 1, text : 'foo', item : null})
      sinon.assert.calledWith(spy, {id : 2, text : 'bar', item : null})
    })
  });

});}); // UIListComponent

pavlov.specify("CanvasComponent", function(){
describe("CanvasComponent", function(){
  var canvas; var cc;

  before(function(){
    $('#qunit-fixture').append('<div id="toggle_control"></div>')

    canvas = new Canvas();
    cc = new CanvasComponent({scene : canvas.scene});
    cc.toggle_canvas_id = '#toggle_control';
    cc.components.push({id : 'component1'});
    cc.shader_components.push({id : 'component2'});
  });

  describe("#toggle_canvas", function(){
    it("returns toggle-canvas-component page component", function(){
      assert(cc.toggle_canvas().selector).equals('#toggle_control');
    })
  });

  describe("#is_showing", function(){
    it("defaults to not showing", function(){
      assert(cc.is_showing()).isFalse()
    })

    it("returns is showing", function(){
      cc.sshow();
      assert(cc.is_showing()).isTrue()
    })
  });

  describe("#shide", function(){
    it("removes components from scene", function(){
      var spy = sinon.spy(canvas.scene, 'remove_component')
      cc.shide();
      sinon.assert.calledWith(spy, {id : 'component1'})
    });

    it("removes components from shader scene", function(){
      var spy = sinon.spy(canvas.scene, 'remove_shader_component')
      cc.shide();
      sinon.assert.calledWith(spy, {id : 'component2'})
    });

    it("sets showing false", function(){
      cc.shide();
      assert(cc.is_showing()).isFalse()
    })

    it("unchecks toggle component", function(){
      var spy = sinon.spy(cc.toggle_canvas(), 'attr')
      cc.shide();
      sinon.assert.calledWith(spy, ':checked', false)
    })
  });

  describe("#sshow", function(){
    it("sets showing true", function(){
      cc.sshow();
      assert(cc.is_showing()).isTrue()
    });

    it("checks toggle component", function(){
      var spy = sinon.spy(cc.toggle_canvas(), 'attr')
      cc.sshow();
      sinon.assert.calledWith(spy, ':checked', true)
    });

    it("adds components to scene", function(){
      var spy = sinon.spy(canvas.scene, 'add_component')
      cc.sshow();
      sinon.assert.calledWith(spy, {id : 'component1'})
    });

    it("adds components to shader scene", function(){
      var spy = sinon.spy(canvas.scene, 'add_shader_component')
      cc.sshow();
      sinon.assert.calledWith(spy, {id : 'component2'})
    });
  })

  describe("#stoggle", function(){
    describe("toggle component is checked", function(){
      it("shows component", function(){
        var stub = sinon.stub(cc.toggle_canvas(), 'is').withArgs(':checked').returns(true)
        var spy  = sinon.spy(cc, 'sshow');
        cc.stoggle();
        sinon.assert.called(spy);
      });
    });

    describe("toggle component is not checked", function(){
      it("hides component", function(){
        var stub = sinon.stub(cc.toggle_canvas(), 'is').withArgs(':checked').returns(false)
        var spy  = sinon.spy(cc, 'shide');
        cc.stoggle();
        sinon.assert.called(spy);
      });
    });

    it("animates scene", function(){
      var spy  = sinon.spy(canvas.scene, 'animate');
      cc.stoggle();
      sinon.assert.called(spy);
    });
  });

  describe("#cwire_up", function(){
    it("wires up toggle component click event", function(){
      var spy = sinon.spy(cc.toggle_canvas(), 'live')
      cc.cwire_up();
      sinon.assert.calledWith(spy, 'click');
    })

    it("unchecks toggle component", function(){
      cc.cwire_up();
      assert(cc.toggle_canvas().attr('checked')).isFalse();
    });

    describe("toggle component clicked", function(){
      it("toggles component in scene", function(){
        var spy = sinon.spy(cc.toggle_canvas(), 'live')
        cc.cwire_up();
        var cb = spy.getCall(0).args[1];
        var spy = sinon.spy(cc, 'stoggle');
        cb.apply(null, []);
        sinon.assert.called(spy);
      });
    });
  });

});}); // CanvasComponent

pavlov.specify("Canvas", function(){
describe("Canvas", function(){
  var canvas;

  before(function(){
    canvas = new Canvas();
    canvas.div_id = '#omega_canvas'
  });

  it("creates scene subcomponent", function(){
    assert(canvas.scene).isTypeOf(Scene);
  })

  describe("#canvas_component", function(){
    it("returns canvas page component", function(){
      assert(canvas.canvas_component().selector).equals('#omega_canvas canvas')
    });
  });

  it("sets scene size to canvas size", function(){
    var scene = new Scene({canvas : canvas});
    var spy = sinon.spy(scene, 'set_size');
    canvas = new Canvas({scene : scene});
    sinon.assert.called(spy);
    // TODO verify actual size
  })

  describe("canvas shown", function(){
    it("shows 'Hide' on canvas toggle control", function(){
      canvas = new Canvas({});
      canvas.show();
      assert(canvas.toggle_control().html()).equals('Hide')
    })
  });

  describe("canvas hidden", function(){
    it("shows 'Show' on canvas toggle control", function(){
      canvas = new Canvas({});
      canvas.hide();
      assert(canvas.toggle_control().html()).equals('Show')
    })
  });

  describe("canvas resized", function(){
    it("resizes scene", function(){
      var spy = sinon.spy(canvas.scene, 'set_size');
      canvas.raise_event('resize');
      sinon.assert.called(spy);
    })

    it("reanimates scene", function(){
      var spy = sinon.spy(canvas.scene, 'animate');
      canvas.raise_event('resize');
      sinon.assert.called(spy);
    })
  });

  describe("canvas clicked", function(){
    it("captures canvas click coordinates", function(){
      var spy = sinon.spy(canvas, 'click_coords');
      canvas.raise_event('click', { pageX : 10, pageY : 20 });
      sinon.assert.calledWith(spy, 10, 20)
    })

    it("passes click coordinates onto scene clicked handler", function(){
      var stub = sinon.stub(canvas, 'click_coords').returns([10, 20]);
      var spy  = sinon.spy(canvas.scene, 'clicked');
      canvas.raise_event('click', { pageX : 10, pageY : 20});
      sinon.assert.calledWith(spy, 10, 20);
    })
  });

});}); // Canvas

pavlov.specify("Scene", function(){
describe("Scene", function(){
  var canvas; var scene;

  before(function(){
    canvas = new Canvas();
    scene = canvas.scene;
  })

  // it("renders to webgl output") // NIY

  it("creates camera subcomponent", function(){
    assert(scene.camera).isTypeOf(Camera);
  })

  it("creates skybox subcomponent", function(){
    assert(scene.skybox).isTypeOf(Skybox);
  })

  it("creates axis subcomponent", function(){
    assert(scene.axis).isTypeOf(Axis);
  })

  it("creates grid subcomponent", function(){
    assert(scene.grid).isTypeOf(Grid);
  })

  //it("adds bloom pass to scene render") // NIY
  //it("adds custom additive shader pass to scene render") // NIY

  describe("#set_size", function(){
    it("it sets THREE renderer size", function(){
      var spy = sinon.spy(scene.renderer, 'setSize');
      scene.set_size(10, 30);
      sinon.assert.calledWith(spy, 10, 30);
    });

    it("sets camera size", function(){
      var spy = sinon.spy(scene.camera, 'set_size');
      scene.set_size(10, 30);
      sinon.assert.calledWith(spy, 10, 30);
    });
  });

  describe("#add_entity", function(){
    var c;

    before(function(){
      c = new TestEntity({ id : 42});
      c.components.push(new THREE.Geometry())
      c.shader_components.push(new THREE.Geometry())
    })

    it("adds entity to scene", function(){
      scene.add_entity(c);
      assert(scene.entities[42]).equals(c)
    });

    it("adds entity components to scene", function(){
      var spy = sinon.spy(scene, 'add_component');
      scene.add_entity(c);
      sinon.assert.calledWith(spy, c.components[0]);
    });

    it("adds entity shader components to shader scene", function(){
      var spy = sinon.spy(scene, 'add_shader_component');
      scene.add_entity(c);
      sinon.assert.calledWith(spy, c.shader_components[0]);
    });

    it("invokes entity.added_to(scene)", function(){
      var spy = sinon.spy();
      c.added_to = spy;
      scene.add_entity(c);
      sinon.assert.calledWith(spy, scene);
    })
  });

  describe("#add_new_entity", function(){
    describe("entity in scene", function(){
      it("does not add entitiy to scene", function(){
        var c = new TestEntity({ id : 42});
        scene.add_entity(c);
        var spy = sinon.spy(scene, 'add_entity');
        scene.add_new_entity(c);
        sinon.assert.notCalled(spy);
      });
    });

    describe("entity not in scene", function(){
      it("invokes add_entity", function(){
        var spy = sinon.spy(scene, 'add_entity');
        var c = new TestEntity({ id : 42});
        scene.add_new_entity(c);
        sinon.assert.called(spy);
      })
    });
  });

  describe("#remove_entity", function(){
    describe("entity not in scene", function(){
      it("does not modify entities", function(){
        var c1 = new TestEntity({ id : 42});
        var c2 = new TestEntity({ id : 43});
        scene.add_entity(c1);
        scene.remove_entity(c2.id);
        assert(scene.entities[c1.id]).equals(c1);
      });
    });

    it("removes each entity component from scene", function(){
      var spy = sinon.spy(scene, 'remove_component');
      var c = new TestEntity({ id : 42});
      c.components.push(new THREE.Geometry())
      scene.add_entity(c);
      scene.remove_entity(c.id);
      sinon.assert.calledWith(spy, c.components[0]);
    });

    it("removes each entity shader component from scene", function(){
      var spy = sinon.spy(scene, 'remove_shader_component');
      var c = new TestEntity({ id : 42});
      c.shader_components.push(new THREE.Geometry())
      scene.add_entity(c);
      scene.remove_entity(c.id);
      sinon.assert.calledWith(spy, c.shader_components[0]);
    });

    it("invokes entity.removed_from(scene)", function(){
      var spy = sinon.spy();
      var c = new TestEntity({ id : 42});
      c.removed_from = spy;

      scene.add_entity(c);
      scene.remove_entity(c.id);
      sinon.assert.calledWith(spy, scene);
    });
  });

  describe("#reload_entity", function(){
    var c;

    before(function(){
      c = new TestEntity({id : 42});
      scene.add_entity(c);
    })

    describe("entity not in scene", function(){
      it("does not modify entities", function(){
        var spy1 = sinon.spy(scene, 'remove_entity')
        var spy2 = sinon.spy(scene, 'add_entity')
        scene.reload_entity(new TestEntity({id : 43}))
        sinon.assert.notCalled(spy1)
        sinon.assert.notCalled(spy2)
      });
    });

    it("removes entity from scene", function(){
      var spy = sinon.spy(scene, 'remove_entity')
      scene.reload_entity(c);
      sinon.assert.calledWith(spy, c.id)
    })

    describe("callback specified", function(){
      it("invokes callback with scene & entity", function(){
        var spy = sinon.spy();
        scene.reload_entity(c, spy);
        sinon.assert.calledWith(spy, scene, c);
      });
    });

    it("adds entity to scene", function(){
      var spy = sinon.spy(scene, 'add_entity');
      scene.reload_entity(c);
      sinon.assert.calledWith(spy, c);
    });

    it("animates scene", function(){
      var spy = sinon.spy(scene, 'animate');
      scene.reload_entity(c);
      sinon.assert.called(spy);
    });
  });

  describe("#has", function(){
    describe("scene has entity", function(){
      it("returns true", function(){
        var c = new TestEntity({id : 42});
        scene.add_entity(c);
        assert(scene.has(c.id)).isTrue();
      });
    });

    describe("scene does not have entity", function(){
      it("returns false", function(){
        var c = new TestEntity({id : 42});
        assert(scene.has(c.id)).isFalse();
      });
    });
  });

  describe("#clear_entities", function(){
    var c1, c2;

    before(function(){
      c1 = new TestEntity({id : 42});
      c2 = new TestEntity({id : 43});
      scene.add_entity(c1);
      scene.add_entity(c2);
    })

    it("removes each entity", function(){
      var spy = sinon.spy(scene, 'remove_entity');
      scene.clear_entities();
      sinon.assert.calledWith(spy, c1.id.toString());
      sinon.assert.calledWith(spy, c2.id.toString());
    });

    it("clears entities array", function(){
      scene.clear_entities();
      assert(scene.entities).empty();
    })
  });

  describe("#objects", function(){
    it("returns scene objects", function(){
      var m = new THREE.Mesh()
      scene._scene.add(m);
      assert(scene.objects().length).equals(1);
      assert(scene.objects()[0]).equals(m);
    })
  })

  describe("#add_component", function(){
    it("adds component to THREE scene", function(){
      var spy = sinon.spy(scene._scene, 'add');
      var c = new THREE.Geometry()
      scene.add_component(c);
      sinon.assert.calledWith(spy, c);
    });
  });

  describe("#add_shader_component", function(){
    it("adds component to THREE shader scene", function(){
      var spy = sinon.spy(scene._shader_scene, 'add');
      var c = new THREE.Geometry()
      scene.add_shader_component(c);
      sinon.assert.calledWith(spy, c);
    });
  });

  describe("#remove_component", function(){
    it("removes component from THREE scene", function(){
      var spy = sinon.spy(scene._scene, 'remove');
      var c = new THREE.Geometry()
      scene.remove_component(c);
      sinon.assert.calledWith(spy, c);
    });
  });

  describe("#remove_shader_component", function(){
    it("removes component from THREE shader scene", function(){
      var spy = sinon.spy(scene._shader_scene, 'remove');
      var c = new THREE.Geometry()
      scene.remove_shader_component(c);
      sinon.assert.calledWith(spy, c);
    });
  });

  describe("#set", function(){
    it("sets root entity", function(){
      var r = new TestEntity()
      scene.set(r);
      assert(scene.root).equals(r);
    });

    it("adds each child entity", function(){
      var spy = sinon.spy(scene, 'add_entity');
      var r = new TestEntity({ id : 30 })
      var c = new TestEntity({ id : 50 })
      r._children.push(c)
      scene.set(r);
      sinon.assert.calledWith(spy, c);
    });

    it("raises set event", function(){
      var spy = sinon.spy(scene, 'raise_event');
      var r = new TestEntity()
      scene.set(r);
      sinon.assert.calledWith(spy, 'set');
    })

    it("animates the scene", function(){
      var spy = sinon.spy(scene, 'animate');
      var r = new TestEntity()
      scene.set(r);
      sinon.assert.called(spy);
    });
  });

  describe("#get", function(){
    it("returns root entity", function(){
      var r = new TestEntity()
      scene.set(r);
      assert(scene.get()).equals(r);
    })
  });

  describe("#refresh", function(){
    it("resets current root", function(){
      var r = new TestEntity()
      scene.set(r);

      var spy = sinon.spy(scene, 'set');
      scene.refresh();
      sinon.assert.calledWith(spy, r);
    });
  });

  describe("#clicked", function(){
    var c;

    before(function(){
      // TODO setup three scene to test other picking rays
      c = new TestEntity({id : 43})
      c.clickable_obj = new THREE.Mesh(new THREE.SphereGeometry(1000, 100, 100),
                                       new THREE.MeshBasicMaterial({color: 0xABABAB}));
      c.clickable_obj.position.x = 0;
      c.clickable_obj.position.y = 0;
      c.clickable_obj.position.z = -100;
      c.components.push(c.clickable_obj);

      var r = new TestEntity({id : 42})
      r._children.push(c);
      scene.set(r);

      canvas.show();
      canvas.lock(['bottom', 'right']);
      canvas.raise_event('resize')
      //scene.camera.reset();
    });

    it("invokes entity.clicked_in(scene)", async(function(){
      on_animation(scene, function(){
        var spy = sinon.spy(c, 'clicked_in');
        scene.clicked(0, 0);
        assert(1).equals(1);
        sinon.assert.called(spy);
        resume();
      });
      scene.animate();
    }));

    //it("raises click event on entity", async(function(){
    //  on_animation(scene, function(){
    //    var spy = sinon.spy(c, 'raise_event');
    //    scene.clicked(0, 0);
    //    sinon.assert.calledWith(spy, 'click', scene);
    //    resume();
    //  })
    //  scene.animate();
    //}))
    //it("raises clicked space event");
  });

  //describe("#page_coordinate", function(){
  //  it("returns 2d coordinates of 3d coordinate in scene", function(){
  //  });
  //});

  describe("#unselect", function(){
    it("invokes entity.unselected_in(scene)", function(){
      var c = new TestEntity({ id : 42 })
      scene.add_entity(c);
      var spy = sinon.spy(c, 'unselected_in');
      scene.unselect(c.id);
      sinon.assert.calledWith(spy, scene);
    });

    it("raises unselected event on entity", function(){
      var c = new TestEntity({ id : 42 })
      scene.add_entity(c);
      var spy = sinon.spy(c, 'raise_event');
      scene.unselect(c.id);
      sinon.assert.calledWith(spy, 'unselected', scene);
    });
  });

  //describe("#animate", function(){
  //  it("requests animation frame");
  //});
  //describe("#render", function(){
  //  it("renders scene with THREE renderer");
  //});

  describe("#position", function(){
    it("returns THREE scene position", function(){
      assert(scene.position()).equals(scene._scene.position);
    });
  });
});}); // Scene

pavlov.specify("Camera", function(){
describe("Camera", function(){
  var canvas, cam;

  before(function(){
    canvas = new Canvas();
    cam = canvas.scene.camera;
  })

  //describe("#new_cam", function(){
  //  it("creates new THREE perspective camera");
  //});

  //it("handles cam_reset click") // NIY

  describe("#set_size", function(){
    it("sets aspect ratio", function(){
      cam.set_size(200, 100);
      assert(cam._camera.aspect).equals(2)
    });

    describe("invalid aspect ratio", function(){
      it("sets the aspect ratio to 1", function(){
        cam.set_size();
        assert(cam._camera.aspect).equals(1)
      })
    });

    it("updates camera projection matrix", function(){
      var spy = sinon.spy(cam._camera, 'updateProjectionMatrix')
      cam.set_size(200, 100);
      sinon.assert.called(spy);
    })

    it("updates shader camera projection matrix", function(){
      var spy = sinon.spy(cam._shader_camera, 'updateProjectionMatrix')
      cam.set_size(200, 100);
      sinon.assert.called(spy);
    })
  });

  describe("#reset", function(){
    it("sets controls dom element", function(){
      cam.reset();
      assert(cam.controls.domElement).equals(Scene.renderer.domElement)
    });

    it("sets camera position", function(){
      var spy = sinon.spy(cam.controls.object.position, 'set')
      cam.reset();
      sinon.assert.calledWith(spy, 0, 3000, 3000);
    });

    it("focuses camera target on scene", function(){
      var spy = sinon.spy(cam.controls.target, 'set')
      cam.reset();
      sinon.assert.calledWith(spy, 0,0,0);
    });

    it("updates camera controls", function(){
      var spy = sinon.spy(cam.controls, 'update')
      cam.reset();
      sinon.assert.called(spy);
    });

    //it("animates scene", function(){
    //  var spy = sinon.spy(canvas.scene, 'animate')
    //  cam.reset();
    //  sinon.assert.called(spy);
    //});
  });

  describe("#focus", function(){
    it("sets camera target", function(){
        var spy = sinon.spy(cam.controls.target, 'set');
        cam.focus({x:100,y:200,z:100})
        sinon.assert.calledWith(spy, 100,200,100)
    });

    it("updates camera controls", function(){
      var spy = sinon.spy(cam.controls, 'update');
      cam.focus({x:100,y:200,z:100});
      sinon.assert.called(spy);
    });
  });

  // TODO
  // it("wires up page camera controls");
});}); // Camera

pavlov.specify("Skybox", function(){
describe("Skybox", function(){
  describe("#background", function(){
    describe("new background specified", function(){
      it("sets skybox background", function(){
        var sb = new Skybox();
        sb.background('foobar');
        assert(sb.bg).equals('foobar')
      })
    });

    it("returns skybox background", function(){
        var sb = new Skybox();
        sb.background('foobar');
        assert(sb.background()).equals('foobar')
    })
  });
});}); // Skybox

pavlov.specify("Dialog", function(){
describe("Dialog", function(){
  after(function(){
    remove_dialogs();
  })

  describe("#subdiv", function(){
    it("returns subdiv page component", function(){
      $('#omega_dialog').append('<div id="foo"></div>')
      assert(new Dialog().subdiv('foo').selector).equals('#omega_dialog foo')
    });
  });

  it("sets title", function(){
    var d = new Dialog({title : 'd1'})
    assert(d.title).equals('d1')
  });

  it("sets selector", function(){
    var d = new Dialog({selector : '#d1'})
    assert(d.selector).equals('#d1')
  });

  it("sets text", function(){
    var d = new Dialog({text : 'd1'})
    assert(d.text).equals('d1')
  });

  describe("show", function(){
    it("loads content from selector", function(){
      $('#qunit-fixture').append('<div id="foo">test</div>')
      var d = new Dialog({selector : '#foo'})
      d.show();
      assert($('#omega_dialog').html()).equals('test')
    });

    it("appends text", function(){
      var d = new Dialog({text : 'foo'})
      d.show();
      assert($('#omega_dialog').html()).equals('foo')
    })

    it("sets dialog title", function(){
      var d = new Dialog({title : 'foo'})
      d.show();
      assert($('.ui-dialog-title').html()).equals('foo')
    });

    it("opens dialog", function(){
      var d = new Dialog({});
      var spy = sinon.spy(d.component(), 'dialog');
      d.show();
      sinon.assert.calledWith(spy, 'open');
    });
  });

  describe("hide", function(){
    it("closes dialog", function(){
      var d = new Dialog({});
      var spy = sinon.spy(d.component(), 'dialog');
      d.show();
      d.hide();
      sinon.assert.calledWith(spy, 'close');
    });
  });
});}); // Dialog

pavlov.specify("EntitiesContainer", function(){
describe("EntitiesContainer", function(){
  var ec;

  before(function(){
    $('#qunit-fixture').append('<div id="test_ec"><ul></ul></div>');
    ec = new EntitiesContainer({div_id : '#test_ec'});
  })

  it("encapsulates list subcomponent", function(){
    assert(ec.list).isNotNull();
    //assert(ec.list.prototype).equals(UIListComponent); TODO
  });

  it("wraps item list in a ul", function(){
    ec.list.add_text("foobar")
    assert(ec.list.component().selector).equals('#test_ec ul');
  });

  describe("mouse enter event", function(){
    it("shows component", function(){
      var spy = sinon.spy(ec.list, 'show');
      ec.raise_event('mouseenter')
      sinon.assert.called(spy);
    })
  });

  describe("mouse leave event", function(){
    it("hides ul", function(){
      var spy = sinon.spy(ec.list, 'hide');
      ec.raise_event('mouseleave')
      sinon.assert.called(spy);
    })
  });

  describe("#hide_all", function(){
    before(function(){
      $('#qunit-fixture').append('<div id="hide-test1" class="entities_container"></div>')
      $('#qunit-fixture').append('<div id="missions_button"></div>')
    })

    it("hides all entities containers", function(){
      EntitiesContainer.hide_all();
      assert($('#hide-test1').css('display')).equals('none')
    })

    it("hides missions button", function(){
      EntitiesContainer.hide_all();
      assert($('#missions_button').css('display')).equals('none')
    })
  });
});}); // EntitiesContainer

pavlov.specify("StatusIndicator", function(){
describe("StatusIndicator", function(){
  var si;
  before(function(){
    si = new StatusIndicator();
  })

  describe("#set_bg", function(){
    it("sets component background", function(){
      si.set_bg('foobar');
      assert(si.component().css('background-image')).isNotEqualTo('') // TODO better regex based match
    });

    describe("specified background is null", function(){
      it("clears component background", function(){
        si.set_bg();
        assert(si.component().css('background-image')).equals('none')
      });
    });
  });

  describe("#has_state", function(){
    describe("state is on state stack", function(){
      it("returns true", function(){
        si.push_state('st1');
        assert(si.has_state('st1')).isTrue();
      });
    });
    describe("state is not on state stack", function(){
      it("returns false", function(){
        assert(si.has_state('st1')).isFalse();
      });
    });
  });

  describe("#is_state", function(){
    describe("state is last state stack", function(){
      it("returns true", function(){
        si.push_state('st1');
        si.push_state('st2');
        assert(si.is_state('st2')).isTrue();
      });
    });

    describe("state is not last state on stack", function(){
      it("returns false", function(){
        si.push_state('st1');
        si.push_state('st2');
        assert(si.is_state('st1')).isFalse();
      });
    });
  });

  describe("push_state", function(){
    it("pushes new state onto stack", function(){
      si.push_state('st1');
      assert(si.has_state('st1')).isTrue();
    });

    it("sets background", function(){
      var spy = sinon.spy(si, 'set_bg')
      si.push_state('st1')
      sinon.assert.calledWith(spy, 'st1');
    });
  });

  describe("pop_state", function(){
    it("pops a state off stack", function(){
      si.push_state('st1');
      si.pop_state();
      assert(si.has_state('st1')).isFalse();
    });

    it("sets background", function(){
      var spy = sinon.spy(si, 'set_bg')
      si.push_state('st1')
      si.push_state('st2')
      si.pop_state();
      sinon.assert.calledWith(spy, 'st1');
      si.pop_state();
      sinon.assert.calledWith(spy, null);
    });
  });
});}); // StatusIndicator

pavlov.specify("NavContainer", function(){
describe("NavContainer", function(){
  var nc;

  before(function(){
    nc = new NavContainer();
  })

  describe("#show_login_controls", function(){
    before(function(){
      nc.show_login_controls();
    })

    it("shows register link", function(){
      assert(nc.register_link.component().is(':visible')).isTrue();
    });

    it("shows login link", function(){
      assert(nc.login_link.component().is(':visible')).isTrue();
    });

    it("hides account link", function(){
      assert(nc.account_link.component().is(':hidden')).isTrue();
    });

    it("hides logout link", function(){
      assert(nc.logout_link.component().is(':hidden')).isTrue();
    });
  });

  describe("#show_logout_controls", function(){
    before(function(){
      nc.show_logout_controls();
    });

    it("hides register link", function(){
      assert(nc.register_link.component().is(':hidden')).isTrue();
    });

    it("hides login link", function(){
      assert(nc.login_link.component().is(':hidden')).isTrue();
    });

    it("shows account link", function(){
      assert(nc.account_link.component().is(':visible')).isTrue();
    });

    it("shows logout link", function(){
      assert(nc.logout_link.component().is(':visible')).isTrue();
    });
  });
});}); // NavContainer

pavlov.specify("AccountInfoContainer", function(){
describe("AccountInfoContainer", function(){
  var aic;

  before(function(){
    aic = new AccountInfoContainer();
  })

  describe("#username", function(){
    it("gets username input value", function(){
      $('#account_info_username input').attr('value', 'foobar');
      assert(aic.username()).equals('foobar')
    })

    it("sets username input value", function(){
      aic.username('test');
      assert($('#account_info_username input').attr('value')).equals('test');
    })
  });

  describe("#password", function(){
    it("gets password input value", function(){
      $('#user_password').attr('value', 'foobar');
      assert(aic.password()).equals('foobar')
    })
  });

  describe("#email", function(){
    it("gets email input value", function(){
      $('#account_info_email input').attr('value', 'foo@bar');
      assert(aic.email()).equals('foo@bar')
    });

    it("sets email input value", function(){
      aic.email('foo@bar');
      assert($('#account_info_email input').attr('value')).equals('foo@bar');
    });
  });

  describe("#gravatar", function(){
    it("sets gravatar page component value", function(){
      var hsh  = md5('foo@bar');
      var gurl = 'http://gravatar.com/avatar/' + hsh + '?s=175';

      aic.gravatar('foo@bar');
      assert($('#account_logo').html()).
        equals('<img src="'+gurl+'" alt="gravatar" title="gravatar">');
    });
  });

  describe("#entities", function(){
    it("sets entities lists", function(){
      var sh1 = new Ship({id : 'sh1', type : 'corvette'});
      var sh2 = new Ship({id : 'sh2', type : 'corvette'});
      var st1 = new Station({id : 'st1', type : 'manufacturing'});
      aic.entities([sh1, sh2, st1])
      assert($('#account_info_ships').text()).equals('sh1 sh2 ')
      assert($('#account_info_stations').text()).equals('st1 ');
    });
  });

  describe("#passwords_match", function(){
    describe("passwords match", function(){
      it("returns true", function(){
        $('#user_password').attr('value', 'foobar');
        $('#user_confirm_password').attr('value', 'foobar');
        assert(aic.passwords_match()).equals(true);
      })
    });
    describe("passwords don't match", function(){
      it("returns false", function(){
        $('#user_password').attr('value', 'foobar');
        $('#user_confirm_password').attr('value', 'barfoo');
        assert(aic.passwords_match()).equals(false);
      });
    });
  });

  describe("#user", function(){
    it("returns new user created from inputs", function(){
      $('#account_info_username input').attr('value', 'uid');
      $('#user_password').attr('value', 'pass');
      $('#account_info_email input').attr('value', 'u@ser');
      var u =aic.user();
      assert(u.id).equals('uid');
      assert(u.password).equals('pass');
      assert(u.email).equals('u@ser');
    });
  });

  describe("#add_badge", function(){
    it("it adds badge to ui", function(){
      aic.add_badge('bid', 'bdd', 1);
      assert($('#account_info_badges').html()).equals(
        '<div class="badge" style="background: url(\''+
          $omega_config.prefix+
        '/images/badges/bid.png\');">bdd: 2</div>');
    });
  });

});}); // AccountInfoContainer

pavlov.specify("EffectsContainer", function(){
describe("EffectsContainer", function(){
  var scene;
  var ec;

  before(function(){
    scene = new Scene({});
    ec = new EffectsPlayer({path : 'path/', scene : scene});
  })

  it("wires up a jplayer instance", function(){ // NIY how to actually test jplayer init
    assert(ec._player.selector).equals('#effects_jplayer')
    //assert(ec._player.init.jPlayer).isNotNull();
    //assert($(ec.div_id).jPlayer("option", "cssSelectorAncestor")).equals("effects_jplayer_container");
  });

  it("creates timer to run effects", function(){
    assert(ec.effects_timer).isNotNull();
    // TODO assert is stopped & interval
  });

  describe("#play", function(){
    it("sets jplayer media", function(){
      var spy = sinon.spy(ec._player, 'jPlayer');
      ec.play('foo');
      ec.play('foo');
      sinon.assert.calledWith(spy, 'setMedia', { wav : 'path/foo'})
      sinon.assert.calledThrice(spy); // one call to setMedia and two play calls,
    })

    it("plays jplayer", function(){
      var spy = sinon.spy(ec._player, 'jPlayer');
      ec.play('foo');
      sinon.assert.calledWith(spy, 'play');
    });
  });

  describe("#effects_loop", function(){
    var cb;
    before(function(){
      EffectsPlayer._instance = ec;
      cb = EffectsPlayer.effects_timer.action;
    })

    it("runs update_particles on all scene objects which define it", function(){
      var o1 = {};
      var o2 = {update_particles : function(){}}
      scene._scene.__objects.push(o1);
      scene._scene.__objects.push(o2);

      var spy = sinon.spy(o2, 'update_particles');
      cb.apply(null);
      sinon.assert.called(spy);
    });

    it("animates scene", function(){
      var spy = sinon.spy(scene, 'animate');
      cb.apply(null);
      sinon.assert.called(spy);
    });
  });

  describe("#start", function(){
    it("runs effects timer", function(){
      var spy = sinon.spy(EffectsPlayer.effects_timer, 'play')
      ec.start();
      sinon.assert.called(spy);
    });
  });
});
});
