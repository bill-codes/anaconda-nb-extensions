Revision Control Mechanism nbextension (a.k.a RCM)

State of the art.

The revision control mechanism extension is a simple model to make version
control over the ipynb files (IPython notebook files). The ipynb files are
JSON-based document persisting the data introduced by user (and the
resulting computations) in the IPython notebook webapp client.
There is an inherent complexity in the version control of these document
because the nature (structure) of the ipynb file. There are a lot of metadata
associated with each "cell" (IPython notebook units of information), and this
metadata can change without actually changing the cell content. This is a big
problem because usually the user wants to keep control over the content of the
cells. Furthermore, the output of the calculations could be actually really big
chunks of binary data which makes virtually impossible to diff the changes (and
also result in really big files to control). These complexities make merging
ipynb files a huge problem with a lot of conflicts which can not be solved
easily (and sometimes it is almost impossible to solve).

Our target.

As you saw, version control over ipynb files is a complex problem to solve and
a complete solution if not available yet, and probably will be not available
soon until figured out and solve some basic problems (it would be great if we
could say to git - or other VSC - just to apply the version control over a
predefined structure, a part of a file, if you know something like that, let me
know!).
So, our solution is pointed to provide a revision control mechanism for the
data analyst, which at first sight, they does not need to perform complex and
advanced operations. In fact they only need a way to persist the changes in
their ipynb files, look for previous revision points, make some diff to see the
previous introduced changes, etc. And the RCM extension covers exactly those
needs, but don't cover some of the previously detailed aspects/problems
described in the State of the art section.

Features.

The RCM nbextension provides essentially 3 buttons to perform 3 actions:

* Info: This option let you know the revision point where you are now.
Also, it lets you see a diff between the current revision point and the latest
changes introduced by you, but not yet commited.

* Checkout: This option trigger a modal view presenting you a tree-based view
of the previous revision points (representing the evolution of your history)
and give you 3 option:

  * Checkout a previous revision point. To do it, you have to select the desired
  revision point a press the "OK" button. That action will load the IPython
  notebook webapp with a "new" notebook file which is actually the "state" of
  that notebook in the selected revision point.
  * Make a diff comparison. If you select two previous revision points in the
  current modal view, you can make a diff using the selected points and the
  result will be presented as a diff view, after you press the "View diff"
  button.
  * Cancel, to close the current modal view.

* Commit: This option lets you "commit" the current changes (I mean persist the
changes in the current VCS supporting the extension, git in this case). In this
way, you keep a permanent record of the changes introduced and you don't have to
be worried about data/information lost. You have a new modal view asking for a
commit message. After writing the message, you commit actually pressing the "OK"
button.

Implementation.

The RCM is a nbextension (js-based extension) actually using the internal
IPython machinery to perform its tasks. We actually call git command sending
this info to the IPython kernel which, in turn, execute our requests and give
us the resulting information that we posteriorly save it to later perform some
other tasks in the js side.

The model behind the extension and accordingly with the proposed target audience
is a simple "linear" model on the surface but a more complex git-based branched
model under the hood.
Starting from a x revision point, every time the user wants to commit new
changes, the extension perform the following actions:

* stash the current work
* create a checkout a new branch
* unstash the previous stashed content
* add the ipynb file
* commit the ipynb file
* checkout master
* merge the branch without conflicts (-X theirs method)
* delete the branch

In this way, we get a model with "the lastest wins" strategy. Merging ipynb
files, as described above, is really hard, so we adopt an non-conflicting
strategy, giving the most important place to the latest changes, something that
usually is in syncro with the data analyst workflow.

With this branched implementation, we perform the checkout of previous revision
points in a simple way just performing the following actions:

* stash the current work
* create a checkout a new branch
(same two previous steps)
* drop the stashed content (if you want to save it you have to commit the
changes before visit a previous revision point).

And now you are in the selected revision point. The user thinks that they went
to a past point, but under the hood is just another branch representing the
state of that point. The user has the option to go from here to another revision
point (in that case the branch is deleted) or it can introduce new changes and
commit them. In the last case, the branch follow the same path described above
for the commit procedure, but without creating a new branch, just performs the
next steps (from add and ahead) with same "latest win" strategy and without any
conflicts.

In this way the user can have a sort of linear "branched" model (sounds mad,
I know) where he can try new things over previous revision points and commit the
changes into the linear history.

A note regarding the diff functionality: it is actually difficult to diff the
ipynb content because of the reason exposed above, but to partially avoid that
problem we perform a "flatten" of the ipynb content to get rid of some of the
metadata information and be able to efficiently diff the actual cell content,
keeping some additional contextual info still present, ie. the cell prompt
number. Then we use the python diff library to actual get the diff content and
present the result to the user in a codemirror instance.

Configuration as standalone nbextension.

The RCM extension can be used as an standalone nbextension.
To use it (and test it) you will need:

* the rcm extension, living here as a PR for now, and also the utils extension:

https://github.com/Anaconda-Server/anaconda-notebook

* Inside your .ipython folder you will find a nbextension folder, you need to
drop the rcm and utils folders (containing the js extension and some other additional
files) there and modify your custom.js to load the extension, ie:

in .ipython/profile_default/static/custom/custom.js (or in your XXX profile)

```javascript
// we want strict javascript that fails on ambiguous syntax
"using strict";

require(["base/js/events"], function (events) {
    events.on("status_started.Kernel", function () {
      IPython.load_extensions('rcm/main');
    });
});
```

OK, that's all for now...

Damian Avila
Continuum Analytics







