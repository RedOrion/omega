# Users rjr adapter
#
# Copyright (C) 2012 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

# FIXME make configurable
RECAPTCHA_ENABLED = true
RECAPTCHA_PRIVATE_KEY = 'CHANGE_ME'

require 'curb'
require 'active_support/inflector'

module Users

class RJRAdapter
  def self.init
    Users::Registry.instance.init
    self.register_handlers(RJR::Dispatcher)
  end

  def self.register_handlers(rjr_dispatcher)
    rjr_dispatcher.add_handler('users::create_entity'){ |entity|
       unless @rjr_node_type == RJR::LocalNode::RJR_NODE_TYPE
         Users::Registry.require_privilege(:privilege => 'create', :entity => 'users_entities',
                                           :session   => @headers['session_id'])
       end

       raise ArgumentError, "entity must be one of #{Users::Registry::VALID_TYPES}" unless Users::Registry::VALID_TYPES.include?(entity.class)
       raise ArgumentError, "entity id #{entity.id} already taken" unless Users::Registry.instance.find(:type => entity.class.to_s, :id => entity.id).empty?

       entity.secure_password = true if entity.is_a? Users::User

       Users::Registry.instance.create entity
    }

    rjr_dispatcher.add_handler(['users::get_entity', 'users::get_entities']){ |*args|
       filter = {}
       while qualifier = args.shift
         raise ArgumentError, "invalid qualifier #{qualifier}" unless ["of_type", "with_id"].include?(qualifier)
         val = args.shift
         raise ArgumentError, "qualifier #{quanlifier} requires value" if val.nil?
         qualifier = case qualifier
                       when "of_type"
                         :type
                       when "with_id"
                         :id
                     end
         filter[qualifier] = val
       end

       return_first = filter.has_key?(:id)

       entities = Users::Registry.instance.find(filter)

       if return_first
         entities = entities.first
         raise Omega::DataNotFound, "users entity specified by #{filter.inspect} not found" if entities.nil?
         Users::Registry.require_privilege(:any => [{:privilege => 'view', :entity => "users_entity-#{entities.id}"},
                                                    {:privilege => 'view', :entity => 'users_entities'}],
                                           :session   => @headers['session_id'])

       else
         entities.reject! { |entity|
           !Users::Registry.check_privilege(:any => [{:privilege => 'view', :entity => "users_entity-#{entity.id}"},
                                                     {:privilege => 'view', :entity => 'users_entities'}],
                                            :session => @headers['session_id'])
         }
       end

       entities
    }

    rjr_dispatcher.add_handler('users::send_message') { |message|
      raise ArgumentError, "message must be a string of non-zero length" unless message.is_a?(String) && message != ""

      user = Users::Registry.instance.current_user :session => @headers['session_id']

      Users::Registry.require_privilege(:any => [{:privilege => 'modify', :entity => "user-#{user.id}"},
                                                 {:privilege => 'modify', :entity => 'users'}],
                                        :session   => @headers['session_id'])

       Users::ChatProxy.proxy_for(user.id).proxy_message message
       nil
     }

    rjr_dispatcher.add_handler('users::subscribe_to_messages') {
       user = Users::Registry.instance.current_user :session => @headers['session_id']

       # TODO ensure that rjr_node_type supports persistant connections

       Users::Registry.require_privilege(:any => [{:privilege => 'view', :entity => "user-#{user.id}"},
                                                  {:privilege => 'view', :entity => "users_entity-#{user.id}"},
                                                  {:privilege => 'view', :entity => 'users_entities'}],
                                         :session => @headers['session_id'])

       callback = Users::ChatCallback.new { |message|
         begin
           @rjr_callback.invoke('users::on_message', message)
         rescue RJR::Errors::ConnectionError => e
           RJR::Logger.warn "subscribe_to_messages #{user.id} client disconnected"
           # Users::ChatProxy.proxy_for(user.id).remove_callback # TODO
         end
       }

       #@rjr_node.on(:closed) { |node|
       # Users::ChatProxy.proxy_for(user.id).remove_callback # TODO
       #}

       Users::ChatProxy.proxy_for(user.id).add_callback callback
       nil
     }

     rjr_dispatcher.add_handler('users::login') { |user|
       raise ArgumentError, "user must be an instance of Users::User" unless user.is_a?(Users::User)
       session = nil
       user_entity = Users::Registry.instance.find(:id => user.id).first
       raise Omega::DataNotFound, "user specified by id #{user.id} not found" if user_entity.nil?
       if user_entity.valid_login?(user.id, user.password)
         # TODO store the rjr node which this user session was established on for use in other handlers
         session = Users::Registry.instance.create_session(user_entity)
       else
         raise ArgumentError, "invalid user"
       end
       session
     }

     rjr_dispatcher.add_handler('users::logout') { |session_id|
       user = Users::Registry.instance.find(:session_id => session_id).first
       raise Omega::DataNotFound, "user specified by session_id #{session_id} not found" if user.nil?
       Users::Registry.require_privilege(:any => [{:privilege => 'modify', :entity => "user-#{user.id}"},
                                                  {:privilege => 'modify', :entity => 'users'}],
                                         :session   => @headers['session_id'])

       Users::Registry.instance.destroy_session(:session_id => session_id)
       nil
     }

     rjr_dispatcher.add_handler('users::add_privilege') { |*args|
       unless @rjr_node_type == RJR::LocalNode::RJR_NODE_TYPE
         Users::Registry.require_privilege(:privilege => 'modify', :entity => 'users_entities',
                                           :session   => @headers['session_id'])
       end

       user_id      = args[0]
       privilege_id = args[1]
       entity_id    = args.length > 2 ? args[2] : nil
       # TODO verify privilege_id and entity_id are valid values?

       user = Users::Registry.instance.find(:id => user_id).first
       raise Omega::DataNotFound, "user specified by id #{user_id} not found" if user.nil?
       user.add_privilege Privilege.new(:id => privilege_id, :entity_id => entity_id)
       nil
     }

     rjr_dispatcher.add_handler("users::register") { |user|
       raise ArgumentError, "user must be an instance of Users::User" unless user.is_a?(Users::User)

       # validate email format, user isn't already taken
       raise ArgumentError, "invalid user email"    unless user.valid_email?
       raise ArgumentError, "user id already taken" unless Users::Registry.instance.find(:id => user.id).empty?
       raise ArgumentError, "valid username and password is required"  unless user.id.is_a?(String) && user.password.is_a?(String) && user.id != "" && user.password != ""

       if RECAPTCHA_ENABLED
         # TODO ensure node type isn't amqp so that client_ip is available ?
         # ensure recaptcha is valid
         recaptcha_response = Curl::Easy.http_post 'http://www.google.com/recaptcha/api/verify',
                                             Curl::PostField.content('privatekey', RECAPTCHA_PRIVATE_KEY),
                                             Curl::PostField.content('remoteip', @client_ip),
                                             Curl::PostField.content('challenge', user.recaptcha_challenge),
                                             Curl::PostField.content('response', user.recaptcha_response)
         recaptcha_response = recaptcha_response.body_str.split.first
         raise ArgumentError, "invalid recaptcha" if recaptcha_response != "true"
       end

       # generate random registraton code
       user.registration_code = Users::User.random_registration_code

       user.alliances = []
       user.secure_password = true

       # create new user
       Users::Registry.instance.create user

       # send users::confirm_register link via email
       # TODO make configurable
       message = <<MESSAGE_END
From: #{EmailHelper.instance.from_address}
To: #{user.email}
Subject: New Omega Account

This is to inform you that your new omega account has been created. You
will need to activate your registration code by navigating to the following
link:

  http://localhost/wotel/confirm.html?rc=#{user.registration_code}

MESSAGE_END
       EmailHelper.instance.send_email user.email, message

       user
     }

     rjr_dispatcher.add_handler("users::confirm_register") { |registration_code|
       user = Users::Registry.instance.find(:registration_code => registration_code).first
       raise Omega::DataNotFound, "user specified by registration code #{registration_code} not found" if user.nil?

       user.registration_code = nil

       # assign it base privileges

       # TODO issue request to create mediawiki user
       nil
     }

     rjr_dispatcher.add_handler("users::update_user") { |user|
       raise ArgumentError, "user must be an instance of Users::User" unless user.is_a?(Users::User)

       user_entity = Users::Registry.instance.find(:id => user.id).first
       raise Omega::DataNotFound, "user specified by id #{user.id} not found" if user_entity.nil?
       Users::Registry.require_privilege(:any => [{:privilege => 'modify', :entity => "user-#{user.id}"},
                                                  {:privilege => 'modify', :entity => 'users'}],
                                         :session   => @headers['session_id'])
       user_entity.update!(user)
       user_entity
     }

    rjr_dispatcher.add_handler('users::save_state') { |output|
      raise Omega::PermissionError, "invalid client" unless @rjr_node_type == RJR::LocalNode::RJR_NODE_TYPE
      output_file = File.open(output, 'a+')
      Users::Registry.instance.save_state(output_file)
      output_file.close
    }

    rjr_dispatcher.add_handler('users::restore_state') { |input|
      raise Omega::PermissionError, "invalid client" unless @rjr_node_type == RJR::LocalNode::RJR_NODE_TYPE
      input_file = File.open(input, 'r')
      Users::Registry.instance.restore_state(input_file)
      input_file.close
    }

  end

end # class RJRAdapter

end # module Users
