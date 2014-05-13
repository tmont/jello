# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"

  config.vm.provision :puppet do |puppet|
    puppet.manifests_path = "cfg/manifests"
    puppet.manifest_file = "dev.local.pp"
    puppet.module_path = "puppet/modules"
    puppet.facter = { "fqdn" => "jello.dev.local" }
    puppet.options = "--environment=dev"
  end

  config.vm.provider :virtualbox do |vb|
    vb.customize ["modifyvm", :id, "--memory", "1024"]
    vb.customize ["modifyvm", :id, "--cpus", "1"]
    vb.customize ["modifyvm", :id, "--name", "jello"]
  end
end
