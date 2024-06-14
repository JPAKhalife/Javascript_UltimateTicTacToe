-- @Description: This file is used to create the database schema

-- Create the first database
CREATE DATABASE IF NOT EXISTS ultimatetictactoe;

-- Use the database
USE ultimatetictactoe;

-- Create the first table - This table is meant to hold all the current ongoing games of Ultimate Tic Tac Toe
CREATE TABLE IF NOT EXISTS lobbies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lobby_name VARCHAR(255) NOT NULL PRIMARY KEY,
    has_lobby_password BOOLEAN DEFAULT FALSE,
    lobby_password VARCHAR(255),
    lobby_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    game_state VARCHAR(255) NOT NULL,
);

-- Create the second table - This table is meant to hold all the users that are currently playing on a lobby (authentication purposes)
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    lobby VARCHAR(255) NOT NULL FOREIGN KEY REFERENCES 'lobbies'('lobby_name'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);