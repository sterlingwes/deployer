# deployer

Small server for running commands on webhooks

Intended for use behind an SSL-terminating load balancer with whitelisted IPs for the incoming webhook services.

Requires Node 6+ on Ubuntu (if using upstart).

## Setup

`npm install -g sterlingwes/deployer`

`deployer help` for details on commands.

## Running with Upstart

Generate the upstart script:

`sudo deployer setup-ubuntu > /etc/init/deployer.conf`

Start the service:

`service deployer start`

## Todo

* validate webhooks according to the service's guidelines (ie: [Travis CI uses a Signature header](https://docs.travis-ci.com/user/notifications/#Verifying-Webhook-requests))
* add `setuid` to upstart script so we can avoid running as root by default
* better config docs & configurability