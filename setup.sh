#!/bin/bash

# Step 1: Install basic dependencies
sudo apt install -y python3 python3-venv python3-pip curl screen git yarn

# Step 2: Add Yarn GPG key
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -

# Step 3: Add Yarn repo
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

# Step 4: Update package list and install Yarn
sudo apt update && sudo apt install -y yarn

# Step 5: Install Node.js using zunxbt script
curl -sSL https://raw.githubusercontent.com/zunxbt/installation/main/node.sh | bash

# Step 6: Clone the rl-swarm repo
rm -rf rl-swarm && git clone https://github.com/zunxbt/rl-swarm.git && cd rl-swarm

# Step 7: Start a screen session named 'gensyn'
screen -S gensyn -dm bash -c 'python3 -m venv .venv && source .venv/bin/activate && ./run_rl_swarm.sh'
