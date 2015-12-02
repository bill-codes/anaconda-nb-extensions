#conda_envs.nbextension generator-nbextension
> Create your own nbextensions

## Installation

First, install [Yeoman](http://yeoman.io) and generator-nbextension using
[npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).


```bash
npm install -g yo
npm install gulp
npm install -g 
```

Then generate your new project:

```bash
mkdir hello
pushd hello
yo nbextension
```

## Development

```bash
conda create -n notebooks nodejs -c javascript
npm install
npm install -g yo
npm link
```

Once you want to start testing run:

```bash
yo nbextension
```

And start hacking!

## License

 © [Continuum Analytics](http://continuum.io)
