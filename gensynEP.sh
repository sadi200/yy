#!/bin/bash

# Disable and remove existing swap
sudo swapoff -a
sudo rm -f /swapfile

# Create new swap file
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Show swap status
swapon --show
free -h

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Update and install essential packages
sudo apt update && sudo apt install -y sudo
sudo apt update && sudo apt install -y \
  python3 python3-venv python3-pip curl wget screen git lsof

# Add Yarn repository and install
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install -y yarn

# Run external script
curl -sSL https://raw.githubusercontent.com/sadi200/yy/refs/heads/main/node.sh | bash

# Start a new screen session
screen -S gensyn && cd $HOME && rm -rf gensyn-testnet && git clone https://github.com/zunxbt/gensyn-testnet.git && chmod +x gensyn-testnet/gensyn.sh && ./gensyn-testnet/gensyn.sh

