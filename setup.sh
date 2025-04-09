#!/bin/bash

# Update and install essential packages
sudo apt update
sudo apt install -y python3 python3-venv python3-pip curl screen git yarn

# Add Yarn package repository
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

# Update and install Yarn
sudo apt update && sudo apt install -y yarn

# Run external node setup script
curl -sSL https://raw.githubusercontent.com/zunxbt/installation/main/node.sh | bash

# Clone RL Swarm repository
rm -rf rl-swarm
git clone https://github.com/zunxbt/rl-swarm.git
cd rl-swarm

# Start a screen session
screen -S gensyn

# Set up Python virtual environment and run the script
python3 -m venv .venv
source .venv/bin/activate
./run_rl_swarm.sh
