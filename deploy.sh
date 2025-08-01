#!/bin/bash

# List of commands
frontend_commands=(
    "cd client"
    "npm run deploy"
    "cd ../"
)

backend_commands=(
    "cd server"
    "cargo lambda build --release"
    "cargo lambda deploy --enable-function-url server"
)

# Function to run commands
run_commands() {
    local commands=("$@")
    for cmd in "${commands[@]}"
    do
        echo "Executing: $cmd"
        eval $cmd
    done
}

# Check for arguments
if [[ $1 == "--frontend" ]]; then
    echo "Running frontend commands..."
    run_commands "${frontend_commands[@]}"
elif [[ $1 == "--backend" ]]; then
    echo "Running backend commands..."
    run_commands "${backend_commands[@]}"
else
    run_commands "${frontend_commands[@]}"
    run_commands "${backend_commands[@]}"
fi
