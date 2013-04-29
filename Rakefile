# Omega Project Rakefile
#
# Copyright (C) 2010-2012 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

require "rake/packagetask"
Rake::PackageTask.new("omega", "0.3.0") do |p|
  p.need_tar = true
  p.package_files.include("bin/**/*","examples/**/*", "lib/**/*",
                          "site/**/*", "spec/**/*", "vendor/**/*",
                          "tests/**/*", "omega.yml", "Rakefile",
                          "COPYING", "LICENSE", "README.md")
  p.package_files.exclude("lib/rjr*", "site/build/**/*")
end

begin
  require 'parallel_tests'
  desc "Run all specs"
  task :specs do |task, args|
    require 'parallel_tests/tasks'
    Rake::Task['parallel:spec'].invoke
  end

rescue LoadError => e
  require "rspec/core/rake_task"
  desc "Run all specs"
  RSpec::Core::RakeTask.new(:specs) do |spec|
    spec.pattern = 'spec/**/*_spec.rb'
    spec.rspec_opts = ['--backtrace', '-fd', '-c']
  end

end

require "yard"
YARD::Rake::YardocTask.new do |t|
end

desc 'Print the RJR accessible api'
task 'rjr_api' do
  puts "RJR API: "
  Dir.glob('lib/*/rjr_adapter.rb').
      collect { |f| File.open(f).read.split("\n") }.flatten.
      select  { |l| ! l.scan('add_handler').empty? }.
      collect { |l| l.gsub(/rjr_dispatcher\.add_handler\(\[*/, '').gsub(/\]*\).*/, '') }.
      collect { |m| m.strip.gsub(/"/, '').gsub(/'/, '') }.
      each { |m|
        puts "#{m}"
      }
end

# TODO task to output api callback methods client can handle

namespace :site do
  desc 'Preview the site'
  task 'preview' do
    puts "Starting middleman at http://localhost:4567"
    Dir.chdir 'site'
    system("middleman server -p 4567 --verbose")
  end

  desc 'Build the site'
  task 'build' do
    Dir.chdir 'site'
    system("middleman build")
  end

  # FIXME doc and test tasks for site
end
