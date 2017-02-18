# Diane

Diane is a dictaphone-like tool that runs in your terminal. As you would expect from a dictaphone, it
can record and play back the recorded audio.

The recordings are saved in a directory structure based on time:

	2017
		|-- February
			|-- 16th
				|-- 17.15.02.wav


It is built entirerly with javasript by abusing the fact that you can use web audio inside of elctron.

# Install
```
npm install diane -g
```
Before running, you need to configure where the recordings made by diane will be saved. This is done by specifying an absolute path as an env var, `DIANE_PATH`.

Now you can simply type `$ diane` in your terminal and follow the instructions.

# Development
After cloning the repository and following the install instructions above, you need to do the following:

1. `cd` into the cloned repository.

2. Install local dependencies with `npm install`.

3. Link the global diane command with `npm link`. This will point the global command to the diane source files you're currently working on. (Undo this with `npm unlink`)

