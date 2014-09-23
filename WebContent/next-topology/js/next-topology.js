(function (nx, global) {

    nx.define("nx.util", {
        static: true,
        methods: {
            without: function (arrray, item) {
                var index;
                while ((index = arrray.indexOf(item)) != -1) {
                    arrray.splice(index, 1);
                }
                return arrray;
            },
            find: function (arrray, iterator, context) {
                var result;
                arrray.some(function (value, index, list) {
                    if (iterator.call(context || this, value, index, list)) {
                        result = value;
                        return true;
                    }
                });
                return result;
            },
            uniq: function (array, iterator, context) {
                var initial = iterator ? array.map(array, iterator.bind(context || this)) : array;
                var results = [];
                nx.each(initial, function (value, index) {
                    if (results.indexOf(value) == -1) {
                        results.push(array[index]);
                    }
                });
                return results;
            },
            indexOf: function (array, item) {
                return array.indexOf(item);
            },
            setProperty: function (source, key, value, owner) {
                var propValue;
                var rpatt = /(?={)\{([^{}]+?)\}(?!})/;
                if (value !== undefined) {
                    var model = source.model();
                    if (nx.is(value, 'String') && rpatt.test(value)) {
                        var expr = RegExp.$1;
                        if (expr[0] === '#') {
                            source.setBinding(key, 'owner.' + expr.slice(1), owner);
                        }
                    } else if (nx.is(value, 'Function')) {
                        propValue = value.call(source, model, source);
                        source.set(key, propValue);
                    } else if (nx.is(value, 'String')) {
                        var path = value.split('.');
                        if (path.length == 2 && path[0] == 'model') {
                            source.setBinding(key, value, source);
                        } else {
                            source.set(key, value);
                        }
                    } else {
                        source.set(key, value);
                    }
                }
            },
            loadScript: function (url, callback) {
                var script = document.createElement("script");
                script.type = "text/javascript";

                if (script.readyState) {  //IE
                    script.onreadystatechange = function () {
                        if (script.readyState == "loaded" ||
                            script.readyState == "complete") {
                            script.onreadystatechange = null;
                            callback();
                        }
                    };
                } else {  //Others
                    script.onload = function () {
                        callback();
                    };
                }
                script.src = url;
                document.getElementsByTagName("head")[0].appendChild(script);
            }
        }
    });


})(nx, nx.global);
(function (nx, util) {
    /**
     * @link http://webstuff.nfshost.com/anim-timing/Overview.html
     * @link https://developer.mozilla.org/en/DOM/window.requestAnimationFrame
     * @link http://dev.chromium.org/developers/design-documents/requestanimationframe-implementation
     */
    var requestAnimationFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            };
    })(), cancelAnimationFrame = (function () {
        return window.cancelAnimationFrame ||
            window.cancelRequestAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.msCancelAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            window.oCancelAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.clearTimeout;
    })();

    nx.define('nx.graphic.Animation', {
        statics: {
            requestAnimationFrame: requestAnimationFrame,
            cancelAnimationFrame: cancelAnimationFrame
        },
        events: ['complete'],
        properties: {
            callback: {
                set: function (value) {
                    this._callback = value;
                    this.createAnimation();
                    if (this.autoStart()) {
                        this.start();
                    }
                },
                get: function () {
                    return this._callback || function () {
                    };
                }
            },
            duration: {
                value: 1000
            },
            interval: {
                value: 100 / 60
            },
            autoStart: {
                value: false
            },
            complete: {
                value: function () {
                    return function () {
                    };
                }
            },
            context: {
                value: this
            }
        },
        methods: {
            init: function (opts, args) {
                this.inherited(arguments);
                this.sets(opts);
            },

            createAnimation: function () {
                var self = this;
                var callback = this.callback();
                var duration = this.duration();
                var interval = this.interval();
                var startTime, progress, id, timestamp, lastTime = 0;
                this.fn = function () {
                    timestamp = +new Date();
                    if (!startTime) {
                        startTime = +new Date();
                        progress = 0;
                    } else {
                        if (!duration) {
                            progress = 0;
                        } else {
                            progress = (timestamp - startTime) / duration;
                        }
                    }
                    if (progress >= 1 || (timestamp - lastTime) >= interval) {
                        lastTime = timestamp;
                        if (progress > 1) {
                            progress = 1;
                        }
                        if (callback.call(self.context(), progress) === false) {
                            //break  when user return false
                            duration = 1;
                            self._completeFN();
                        }

                    }
                    if (progress < 1) {
                        self.ani_id = requestAnimationFrame(self.fn);
                    } else if (progress == 1) {
                        self._completeFN();
                    }
                };
            },

            start: function () {
                this.ani_id = requestAnimationFrame(this.fn);
            },
            stop: function () {
                cancelAnimationFrame(this.ani_id);
            },
            _completeFN: function () {
                this.complete().call(this.context());
                this.stop();
                this.fire("complete");
            }
        }
    });
})(nx, nx.util);



(function (nx,global) {
    var zIndex = 1000;
    /**
     * Popup z-index mamager
     * @class nx.widget.ZIndexManager
     * @static
     */
    nx.define('nx.widget.ZIndexManager',null,{
        static: true,
        methods: {
            getIndex: function () {
                return zIndex++;
            }
        }
    });
}(nx,nx.global));
(function (nx, global) {


    var Container = nx.define(nx.ui.Component, {
        view: {
            props: {
                'class': 'nx n-popupContainer',
                style: {
                    'position': 'absolute',
                    'top': '0px',
                    'left': '0px'

                }
            }
        }
    });

    /**
     * Popup container
     * @class nx.ui.PopupContainer
     * @static
     */

    nx.define("nx.ui.PopupContainer", {
        static: true,
        properties: {
            container: {
                value: function () {
                    return new Container();
                }
            }
        },
        methods: {
            addPopup: function (popup) {
                this.container().view().dom().appendChild(popup.view().dom());
            }
        }
    });


    nx.dom.Document.ready(function () {
//        if (document.body.firstChild) {
//            document.body.insertBefore(nx.ui.PopupContainer.container().resolve('@root').$dom, document.body.firstChild);
//        } else {
//            document.body.appendChild(nx.ui.PopupContainer.container().resolve('@root').$dom);
//        }
    }, this);


    setTimeout(function () {
        if (document.body) {
            if (document.body.firstChild) {
                document.body.insertBefore(nx.ui.PopupContainer.container().resolve('@root').$dom, document.body.firstChild);
            } else {
                document.body.appendChild(nx.ui.PopupContainer.container().resolve('@root').$dom);
            }
        } else {
            setTimeout(arguments.callee, 10);
        }
    }, 0);


})(nx, nx.global);
(function (nx, global) {

    var Container = nx.ui.PopupContainer;

    /**
     * Base popup class
     * @class nx.ui.Popup
     * @extend nx.ui.Component
     */
    nx.define("nx.ui.Popup", nx.ui.Component, {
        events: ['open', 'close'],
        view: {
            props: {
                style: "position:absolute"
            }
        },
        properties: {
            /**
             * @property target
             */
            target: {
                value: document
            },
            /**
             * [bottom,top,left,right]
             * @property direction
             */
            direction: {
                value: "auto" //[bottom,top,left,right]
            },
            /**
             * @property width
             */
            width: {
                value: null
            },
            /**
             * @property height
             */
            height: {
                value: null
            },
            /**
             * @property offset
             */
            offset: {
                value: 0
            },
            /**
             * @property offsetX
             */
            offsetX: {
                value: 0
            },
            /**
             * @property offsetY
             */
            offsetY: {
                value: 0
            },
            /**
             * @property align
             */
            align: {
                value: false
            },
            /**
             * @property position
             */
            position: {
                value: 'absolute'
            },
            /**
             * @property location
             */
            location: {
                value: "outer"  // outer inner
            },
            /**
             * @property listenResize
             */
            listenResize: {
                value: false
            },
            /**
             * @property lazyClose
             */
            lazyClose: {
                value: false
            },
            /**
             * @property pin
             */
            pin: {
                value: false
            },
            /**
             * @property registeredPositionMap
             */
            registeredPositionMap: {
                value: {}
            },
            scrollClose: {
                value: false
            }
        },
        methods: {

            init: function (inPros) {
                this.inherited(inPros);
                this.sets(inPros);
                this._defaultConfig = this.gets();
            },
            attach: function (args) {
                this.inherited(args);
                this.appendToPopupContainer();
            },
            appendToPopupContainer: function () {
                if (!this._appended) {
                    Container.addPopup(this);
                    this._delayCloseEvent();
                    this._listenResizeEvent();
                    this._appended = true;
                    this._closed = false;
                }
            },
            /**
             * Open popup
             * @method open
             * @param args {Object} config
             */
            open: function (args) {

                this._clearTimeout();


                var left = 0;
                var top = 0;

                var root = this.resolve('@root');

                this.sets(args || {});


                this._resetOffset(args);
                var prevPosition = root.get("data-nx-popup-direction");
                if (prevPosition) {
                    root.removeClass(prevPosition);
                }
                this.appendToPopupContainer();


                //process target

                var target = this.target();
                var targetSize = {width: 0, height: 0};

                if (target.resolve && target.resolve('@root')) {
                    target = target.resolve('@root');
                }

                // if target is a point {x:Number,y:Number}
                if (target.x !== undefined && target.y !== undefined) {
                    left = target.x;
                    top = target.y;
                } else if (target != document) {
                    var elOffset = target.getOffset();
                    left = elOffset.left;
                    top = elOffset.top;
                    targetSize = target.getBound();
                } else {
                    left = 0;
                    top = 0;
                }


                //process
                var width = this.width();
                var height = this.height();
                if (this.align()) {
                    width = targetSize.width || 0;
                }

                if (width) {
                    root.setStyle('width', width);
                    root.setStyle("max-width", width);
                    this.width(width);
                }

                if (height) {
                    root.setStyle('height', height);
                }

                root.setStyle("display", "block");


                //process position

                left += this.offsetX();
                top += this.offsetY();


                var popupSize = this._popupSize = root.getBound();
//                var margin = position.margin(this._element);
//                var border = position.border(this._element);
//                popupSize.height += margin.top + margin.bottom - border.top - border.bottom;
//                popupSize.width += margin.left + margin.right - border.left - border.right;

//                position.setWidth(this._element, popupSize.width);
//                position.setHeight(this._element, popupSize.height);


                var offset = this.offset();
                var innerPositionMap = {
                    "outer": {
                        bottom: {
                            left: left,
                            top: top + targetSize.height + offset
                        },
                        top: {
                            left: left,
                            top: top - popupSize.height - offset
                        },
                        right: {
                            left: left + targetSize.width + offset,
                            top: top
                        },
                        left: {
                            left: left - popupSize.width - offset,
                            top: top
                        }

                    },
                    "inner": {
                        bottom: {
                            left: left + targetSize.width / 2 - popupSize.width / 2 + offset,
                            top: top
                        },
                        top: {
                            left: left + targetSize.width / 2 - popupSize.width / 2,
                            top: top + targetSize.height - popupSize.height - offset
                        },
                        left: {
                            left: left + targetSize.width - popupSize.width - offset,
                            top: top + targetSize.height / 2 - popupSize.height / 2
                        },
                        right: {
                            left: left + offset,
                            top: top + targetSize.height / 2 - popupSize.height / 2
                        }

                    },
                    "tooltip": {
                        "bottom": {
                            left: left + targetSize.width / 2 - popupSize.width / 2,
                            top: top + targetSize.height + offset + 2
                        },
                        "bottom-left": {
                            left: left - 22,
                            top: top + targetSize.height + offset + 2
                        },
                        "bottom-right": {
                            left: left + targetSize.width - popupSize.width + 22,
                            top: top + targetSize.height + offset + 2
                        },
                        "top": {
                            left: left + targetSize.width / 2 - popupSize.width / 2,
                            top: top - popupSize.height - offset - 2
                        },
                        "top-left": {
                            left: left - 22,
                            top: top - popupSize.height - offset - 2
                        },
                        "top-right": {
                            left: left + targetSize.width / 2 - popupSize.width / 2 + 22,
                            top: top - popupSize.height - offset - 2
                        },
                        "right": {
                            left: left + targetSize.width + offset + 2,
                            top: top + targetSize.height / 2 - popupSize.height / 2
                        },
                        "right-top": {
                            left: left + targetSize.width + offset + 2,
                            top: top <= 0 ? 0 : top - 22
                        },
                        "right-bottom": {
                            left: left + targetSize.width + offset + 2,
                            top: top + targetSize.height - popupSize.height
                        },
                        "left": {
                            left: left - popupSize.width - offset - 2,
                            top: top + targetSize.height / 2 - popupSize.height / 2
                        },
                        "left-top": {
                            left: left - popupSize.width - offset - 2,
                            top: top <= 0 ? 0 : top - 22
                        },
                        "left-bottom": {
                            left: left - popupSize.width - offset - 2,
                            top: top + targetSize.height - popupSize.height
                        }
                    }
                };


                var location = this.location();
                this._directionMap = innerPositionMap[location];


                var direction = this.direction();
                if (direction == null || direction == "auto") {
                    direction = this._hitTest();
                }
                if (!direction) {
                    direction = "bottom";
                }
                var positionObj = this._directionMap[direction];
                root.setStyles({
                    "top": positionObj.top,
                    "left": positionObj.left,
                    "position": "position",
                    "z-index": nx.widget.ZIndexManager.getIndex(),
                    'display': 'block'

                });
                //position.setSize(this,popupSize);

                root.set("data-nx-popup-direction", direction);
                root.addClass("popup");
                root.addClass(direction);
                root.addClass("in");
                this.fire("open");
            },
            /**
             * close popup
             * @method close
             * @param force
             */
            close: function (force) {

                this._clearTimeout();

                var root = this.resolve('@root');

                if (this.pin()) {
                    return;
                }

                if (force || !this.lazyClose()) {
                    this._closed = true;
                    root.removeClass('in');
                    root.setStyle("display", "none");
                    this.fire("close");
                } else {
                    this._delayClose();
                }
            },
            _clearTimeout: function () {
                if (this.timer) {
                    clearTimeout(this.timer);
                }
            },
            _delayClose: function () {
                var self = this;
                this._clearTimeout();
                this.timer = setTimeout(function () {
                    self.close(true);
                }, 500);
            },
            _delayCloseEvent: function () {

                if (this.lazyClose()) {
//                    this.on("mouseover", function () {
//                        var element = this.view().dom().$dom;
//                        var target = event.target;
//                        var related = event.relatedTarget;
//                        if (target && !element.contains(related) && target !== related) {
//                            if (this.timer) {
//                                clearTimeout(this.timer);
//                            }
//                        }
//                    }, this);
//
//                    this.on("mouseout", function () {
//                        var element = this.view().dom().$dom;
//                        var target = event.target;
//                        var related = event.relatedTarget;
//                        if (!element.contains(related) && target !== related) {
//                            clearTimeout(this.timer);
//                            this.close(true);
//                        }
//                    }, this);


                    this.on("mouseenter", function () {
                        if (this.timer) {
                            clearTimeout(this.timer);
                        }
                    }, this);

                    this.on("mouseleave", function () {
                        clearTimeout(this.timer);
                        this.close(true);
                    }, this);
                }
            },
            _listenResizeEvent: function () {
                var self = this;
                var timer;
                if (this.listenResize()) {
//                    nx.app.on('resize', function () {
//                        if (!this._closed) {
//                            if (timer) {
//                                clearTimeout(timer)
//                            }
//                            timer = setTimeout(function () {
//                                self.open();
//                            }, 22);
//                        }
//
//                    }, this);
//
//
//                    nx.app.on('scroll', function () {
//                        if (timer) {
//                            clearTimeout(timer)
//                        }
//                        if (!this._closed) {
//                            timer = setTimeout(function () {
//                                self.open();
//                            }, 22);
//                        }
//                    }, this);

                }


                if (this.scrollClose()) {
//                    nx.app.on('scroll', function () {
//                        if (timer) {
//                            clearTimeout(timer)
//                        }
//                        self.close(true);
//                    }, this);
                }
            },
            _hitTest: function () {
                var docRect = nx.dom.Document.docRect();

                var keys = Object.keys(this._directionMap);
                var testDirection = keys[0];
                keys.some(function (direction) {
                    var elementRect = {
                        left: this._directionMap[direction].left,
                        top: this._directionMap[direction].top,
                        width: this._popupSize.width,
                        height: this._popupSize.height

                    };
                    //make sure it visible
                    var resulte = elementRect.left >= docRect.scrollX &&
                        elementRect.top >= docRect.scrollY &&
                        elementRect.left + elementRect.width <= docRect.width + docRect.scrollX &&
                        elementRect.top + elementRect.height <= docRect.height + docRect.scrollY;

                    if (resulte) {
                        testDirection = direction;
                        return true;
                    }
                }, this);
                return testDirection;
            },
            _resetOffset: function (args) {
                if (args) {
//                    if (!args.offset) {
//                        this.offset(this.offset.defaultValue);
//                    }
//
//
//                    if (!args.offsetX) {
//                        this.offsetX(this.offsetX.defaultValue);
//                    }
//
//
//                    if (!args.offsetY) {
//                        this.offsetY(this.offsetY.defaultValue);
//                    }
                }
            }
        }
    });


})(nx, nx.global);
(function (nx, global) {

    /**
     * UI popover class
     * @class nx.ui.Popover
     * @extend nx.ui.Popup
     */
    nx.define("nx.ui.Popover", nx.ui.Popup, {
        properties: {
            /**
             * Popover's title
             */
            title: {
                get: function () {
                    return this._title;
                },
                set: function (value) {
                    if (value) {
                        this.resolve("title").resolve('@root').setStyle("display", "block");

                    } else {
                        this.resolve("title").resolve('@root').setStyle("display", "none");
                    }
                    if (this._title != value) {
                        this._title = value;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            },
            location: {
                value: "tooltip"
            }
        },
        view: {
            props: {
                'class': 'popover fade'
            },
            content: [
                {
                    props: {
                        'class': 'arrow'
                    }
                },
                {
                    tag: 'h3',
                    name: 'title',
                    props: {
                        'class': 'popover-title',
                        style: {
                            display: 'none'
                        }
                    },
                    content: "{#title}"
                },
                {
                    name: 'body',
                    props: {
                        'class': 'popover-content'
                    }
                }
            ]
        },
        methods: {
            getContainer: function () {
                return this.resolve('body').resolve('@root');
            }
        }
    });


})(nx, nx.global);
(function (nx, util, global) {
    /**
     * Global drag manager

     var Component = nx.define(nx.ui.Component, {
        view: {
            content: {
                name: "stage",
                type: 'nx.graphic.TopologyStage',
                props: {
                    width: 600,
                    height: 600
                },
                content: {
                    name: 'a',
                    type: 'nx.graphic.Rect',
                    props: {
                        x: 100,
                        y: 10,
                        width: 100,
                        height: 100,
                        fill: '#f0f'
                    },
                    events: {
                        'mousedown': '{#_mousedown}',
                        'dragmove': '{#_dragmove}'
                    }
                }
            }
        },
        properties: {
            positionX: {
                value: 150
            }
        },
        methods: {
            _mousedown: function (sender, event) {
                event.captureDrag(sender.owner());
            },
            _dragmove: function (sender, event) {
                sender.set("x", sender.get("x") * 1 + event.drag.delta[0]);
                sender.set("y", sender.get("y") * 1 + event.drag.delta[1]);
            }

        }
     });


     var app = new nx.ui.Application();
     var comp = new Component();
     comp.attach(app);


     * @class nx.graphic.DragManager
     * @static
     * @extend nx.Observable
     */

    nx.define("nx.graphic.DragManager", nx.Observable, {
        static: true,
        properties: {
            /**
             * activated element
             * @property node {nx.graphic.Component}
             */
            node: {},
            /**
             * drag track
             * @property track {Array}
             */
            track: {},
            /**
             * Dragging indicator
             * @property dragging
             * @type Boolean
             */
            dragging: {value: false}
        },
        methods: {
            init: function () {
                window.addEventListener('mousedown', this._capture_mousedown.bind(this), true);
                window.addEventListener('mousemove', this._capture_mousemove.bind(this), true);
                window.addEventListener('mouseup', this._capture_mouseup.bind(this), true);
            },
            /**
             * Start drag event capture
             * @method start
             * @param evt {Event} original dom event
             * @returns {function(this:nx.graphic.DragManager)}
             */
            start: function (evt) {
                return function (node) {
                    // make sure only one node can capture the "drag" event
                    if (node && !this.node()) {
                        this.node(node);
                        // track and data
                        var track = [];
                        this.track(track);
                        this.track().push([evt.clientX, evt.clientY]);
                        evt.dragCapture = function () {
                        };
                        return true;
                    }
                }.bind(this);
            },
            /**
             * Drag move handler
             * @method move
             * @param evt {Event} original dom event
             */
            move: function (evt) {
                var node = this.node();
                if (node) {
                    // attach to the event
                    evt.drag = this._makeDragData(evt);

                    if (!this.dragging()) {
                        this.dragging(true);
                        node.fire("dragstart", evt);
                    }
                    // fire events
                    node.fire("dragmove", evt);
                }
            },
            /**
             * Drag end
             * @method end
             * @param evt {Event} original dom event
             */
            end: function (evt) {
                var node = this.node();
                if (node) {
                    // attach to the event
                    evt.drag = this._makeDragData(evt);
                    // fire events
                    node.fire("dragend", evt);
                    // clear status
                    this.node(null);
                    this.track(null);
                    this.dragging(false);
                }
            },
            _makeDragData: function (evt) {
                var track = this.track();
                var current = [evt.clientX, evt.clientY], origin = track[0], last = track[track.length - 1];
                track.push(current);
                // TODO make sure the data is correct when target applied a matrix
                return {
                    target: this.node(),
                    current: current,
                    offset: [current[0] - origin[0], current[1] - origin[1]],
                    delta: [current[0] - last[0], current[1] - last[1]]
                };
            },
            _capture_mousedown: function (evt) {
                if (evt.captureDrag) {
                    this._lastDragCapture = evt.captureDrag;
                }
                if (evt.type === "mousedown") {
                    evt.captureDrag = this.start(evt);
                } else {
                    evt.captureDrag = function () {
                    };
                }
            },
            _capture_mousemove: function (evt) {
                this.move(evt);
            },
            _capture_mouseup: function (evt) {
                this.end(evt);
            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {

    nx.Object.delegateEvent = function (source, sourceEvent, target, targetEvent) {
        if (!target.can(targetEvent)) {
            source.on(sourceEvent, function (sender, event) {
                target.fire(targetEvent, event);
            });
            nx.Object.extendEvent(target, targetEvent);
        }
    };


    //http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm
    var ease = function (t, b, c, d) {
        var ts = (t /= d) * t;
        var tc = ts * t;
        return b + c * (5.7475 * tc * ts + -14.3425 * ts * ts + 8.395 * tc + 1.2 * ts);
    };


    /**
     * Base class of graphic component
     * @class nx.graphic.Component
     * @extend nx.ui.Component
     * @module nx.graphic
     */

    nx.define('nx.graphic.Component', nx.ui.Component, {
        /**
         * Fire when drag start
         * @event dragstart
         * @param sender {Object}  Trigger instance
         * @param event {Object} original event object
         */
        /**
         * Fire when drag move
         * @event dragmove
         * @param sender {Object}  Trigger instance
         * @param event {Object} original event object , include delta[x,y] for the shift
         */
        /**
         * Fire when drag end
         * @event dragend
         * @param sender {Object}  Trigger instance
         * @param event {Object} original event object
         */
        events: ['mouseenter', 'mouseleave', 'dragstart', 'dragmove', 'dragend'],
        properties: {
            /**
             * Set/get x translate
             * @property translateX
             */
            translateX: {
                get: function () {
                    return this._translateX !== undefined ? this._translateX : 0;
                },
                set: function (value) {
                    if (this._translateX !== value) {
                        this._translateX = value;
                        this.setTransform(this._translateX);
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            /**
             * Set/get y translate
             * @property translateY
             */
            translateY: {
                get: function () {
                    return this._translateY !== undefined ? this._translateY : 0;
                },
                set: function (value) {
                    if (this._translateY !== value) {
                        this._translateY = value;
                        this.setTransform(null, this._translateY);
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            /**
             * Set/get scale
             * @property scale
             */
            scale: {
                get: function () {
                    return this._scale !== undefined ? this._scale : 1;
                },
                set: function (value) {
                    if (this._scale !== value) {
                        this._scale = value;
                        this.setTransform(null, null, this._scale);
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            /**
             * Set/get translate, it set/get as {x:number,y:number}
             * @property translate
             */
            translate: {
                get: function () {
                    return{
                        x: this._translateX,
                        y: this._translateY
                    };
                },
                set: function (value) {
                    this.setTransform(value.x, value.y);
                }
            },
            /**
             * Set/get element's visibility
             * @property visible
             */
            visible: {
                get: function () {
                    return this._visible !== undefined ? this._visible : true;
                },
                set: function (value) {
                    this.resolve('@root').setStyle("display", value ? "" : "none");
                    this.resolve('@root').setStyle("pointer-events", value ? "all" : "none");
                    this._visible = value;
                }
            },
            /**
             * Set/get css class
             * @property class
             */
            'class': {
                get: function () {
                    return this._class !== undefined ? this._class : 0;
                },
                set: function (value) {
                    if (this._class !== value) {
                        this._class = value;
                        this.root().addClass(value);
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        view: {},
        methods: {
            init: function (args) {
                this.inherited(args);
                this.sets(args);
            },
            /**
             * Resolve a resource.
             * @method resolve
             * @param name
             * @returns {Any}
             */
            resolve: function (name) {
                var resources = this._resources;
                if (!this._resources) {
                    return null;
                }
                if (name in resources) {
                    return resources[name];
                }
            },
            /**
             * Append component's element to parent node or other dom element
             * @param [parent] {nx.graphic.Component}
             * @method append
             */
            append: function (parent) {
                var parentElement;
                if (parent) {
                    parentElement = this._parentElement = parent.resolve("@root");
                } else {
                    parentElement = this._parentElement = this._parentElement || this.resolve("@root").parentNode();//|| this.parent().resolve("@root");
                }
                if (parentElement && parentElement.$dom && this.resolve("@root") && !parentElement.contains(this.resolve("@root"))) {
                    parentElement.appendChild(this.resolve("@root"));
                }
            },
            /**
             * Remove component's element from dom tree
             * @method remove
             */
            remove: function () {
                var parentElement = this._parentElement = this._parentElement || this.resolve("@root").parentNode();
                if (parentElement && this.resolve("@root")) {
                    parentElement.removeChild(this.resolve("@root"));
                }
            },
            /**
             * Get component dom element by name
             * @param name {String}
             * @returns {nx.dom.Element}
             */
            $: function (name) {
                return this.resolve(name).resolve('@root');
            },
            /**
             * Get component's root dom element
             * @method root
             * @returns {nx.dom.Element}
             */
            root: function () {
                return this.resolve('@root');
            },
            /**
             * Set component's transform
             * @method setTransform
             * @param [translateX] {Number} x axle translate
             * @param [translateY] {Number} y axle translate
             * @param [scale] {Number} element's scale
             * @param [duration=0] {Number} transition time, unite is second
             */
            setTransform: function (translateX, translateY, scale, duration) {

                var tx = translateX != null ? translateX : this._translateX || 0;
                var ty = translateY != null ? translateY : this._translateY || 0;
                var scl = scale != null ? scale : this.scale();


                this.setStyle('transform', ' translate(' + tx + 'px, ' + ty + 'px) scale(' + scl + ')', duration);


                this._translateX = tx;
                this._translateY = ty;
                this._scale = scl;
            },
            /**
             * Set component's css style
             * @method setStyle
             * @param key {String} css key
             * @param value {*} css value
             * @param [duration=0] {Number} set transition time
             */
            setStyle: function (key, value, duration) {
                var el = this.resolve('@root');
                if (duration) {
                    //el.setStyle('-webkit-transition', 'all ' + duration + 's ease');
                    el.setStyle('transition', 'all ' + duration + 's ease');
                } else {
                  //  el.setStyle('-webkit-transition', '');
                    el.setStyle('transition', '');
                }
                el.setStyle(key, value);
            },
            /**
             * Inherited nx.ui.component's upon function, fixed mouseleave & mouseenter event
             * @method upon
             * @param name {String} event name
             * @param handler {Function} event handler
             * @param [context] {Object} event handler's context
             */
            upon: function (name, handler, context) {
                if (name == 'mouseenter') {
                    this.inherited('mouseover', this._mouseenter.bind(this), context);
                }
                if (name == 'mouseleave') {
                    this.inherited('mouseout', this._mouseleave.bind(this), context);
                }
                this.inherited(name, handler, context);
            },
            _mouseenter: function (sender, event) {
                var element = this.root().$dom;
                var target = event.currentTarget, related = event.relatedTarget || event.fromElement;
                if (target && !element.contains(related) && target !== related) {
                    /**
                     * Fire when mouse enter
                     * @event mouseenter
                     * @param sender {Object}  Trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire("mouseenter", event);
                }
            },
            _mouseleave: function (sender, event) {
                var element = this.root().$dom;
                var target = event.currentTarget, related = event.toElement || event.relatedTarget;
                if (!element.contains(related) && target !== related) {
                    /**
                     * Fire when mouse leave
                     * @event mouseenter
                     * @param sender {Object}  Trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire("mouseleave", event);
                }
            },
            /**
             * Get component's bound, delegate element's getBoundingClientRect function
             * @method getBound
             * @returns {*|ClientRect}
             */
            getBound: function () {
                return this.root().$dom.getBoundingClientRect();
            },
            dispose: function () {
                if (this._resources && this._resources['@root']) {
                    this.root().$dom.remove();
                }
                this.inherited();
            },
            /**
             * Set animation for element,pass a config to this function
             * {
             *      to :{
             *          attr1:value,
             *          attr2:value,
             *          ...
             *      },
             *      duration:Number,
             *      complete:Function
             * }
             * @method animate
             * @param config {JSON}
             */
            animate: function (config) {
                var self = this;
                var aniMap = [];
                var el = this.resolve('@root');
                nx.each(config.to, function (value, key) {
                    var oldValue = this.has(key) ? this.get(key) : el.getStyle(key);
                    aniMap.push({
                        key: key,
                        oldValue: oldValue,
                        newValue: value
                    });
                }, this);

                if (this._ani) {
                    this._ani.stop();
                }

                var ani = this._ani = new nx.graphic.Animation({
                    duration: config.duration || 1000,
                    context: config.context || this
                });
                ani.callback(function (progress) {
                    nx.each(aniMap, function (item) {
                        //var value = item.oldValue + (item.newValue - item.oldValue) * progress;
                        var value = ease(progress, item.oldValue, item.newValue - item.oldValue, 1);
                        self.set(item.key, value);
                    });
                    //console.log(progress);
                });

                if (config.complete) {
                    ani.complete(config.complete);
                }
                ani.on("complete", function () {
                    /**
                     * Fired when animation completed
                     * @event animationCompleted
                     * @param sender {Object}  Trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire("animationCompleted");
                }, this);
                ani.start();
            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Topology device icons collection
     * @class nx.graphic.Icons
     * @static
     */
    var ICONS = nx.define('nx.graphic.Icons', {
        static: true,
        statics: {
            /**
             * Get icons collection
             * @static
             * @property icons
             */
            icons: {}
        },
        methods: {
            /**
             * Get icon by type
             * @param type {String}
             * @returns {element}
             * @method get
             */
            get: function (type) {
                return ICONS.icons[type] || ICONS.icons.unknown;
            },
            /**
             * Get icon's svg string
             * @param type {String}
             * @returns {element}
             * @method getSVGString
             */
            getSVGString: function (type) {
                return topology_icon[type].icon;
            },
            /**
             * Get all types list
             * @returns {Array}
             * @method getTypeList
             */
            getTypeList: function () {
                return Object.keys(topology_icon);
            },
            /**
             * Register a new icon to this collection
             * @method registerIcon
             * @param name {String} icon's name
             * @param url {URL} icon's url
             * @param width {Number} icon's width
             * @param height {Number} icon's height
             */
            registerIcon: function (name, url, width, height) {
                var icon1 = document.createElementNS(NS, "image");
                icon1.setAttributeNS(XLINK, 'href', url);
                ICONS.icons[name] = {
                    size: {
                        width: width,
                        height: height
                    },
                    icon: icon1.cloneNode(true),
                    name: name
                };
            },
            /**
             * Iterate all icons
             * @param inCallback {Function}
             * @param [inContext] {Object}
             * @private
             */
            __each__: function (inCallback, inContext) {
                var callback = inCallback || function () {
                };
                nx.each(topology_icon, function (obj, name) {
                    var icon = obj.icon;
                    callback.call(inContext || this, icon, name, topology_icon);
                });
            }
        }
    });


    var LINK = 'xmlns:xlink="http://www.w3.org/1999/xlink"';
    var XLINK = 'http://www.w3.org/1999/xlink';
    var XMLNS = ' xmlns="http://www.w3.org/2000/svg"';
    var NS = "http://www.w3.org/2000/svg";


    var bgColor = "#1F6EEE";


    //
    // class="bg"
    //class="bg" class="stroke"
    // class="stroke"


    var topology_icon = {
        switch: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="61px" height="61px" viewBox="0 0 61 61" enable-background="new 0 0 61 61" xml:space="preserve"><symbol id="Arrow_25" viewBox="-22.86 -13.14 45.721 26.279"><polygon fill="none" points="-22.86,-13.14 22.86,-13.14 22.86,13.14 -22.86,13.14"/><polygon class="white" fill="#FFFFFF" points="-20.298,-2.933 5.125,-2.933 5.125,-9.242 14.827,0.001 5.125,9.242 5.125,2.934 -20.298,2.934 "/></symbol><rect x="0.5" y="0.5"  class="bg" stroke-miterlimit="10" width="60" height="60"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_27_" x="-22.86" y="-13.14" transform="matrix(0.7161 -0.0022 -0.0022 -0.7161 42.4775 24.4277)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_28_" x="-22.86" y="-13.14" transform="matrix(0.7161 -0.0022 -0.0022 -0.7161 42.4775 47.0254)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_29_" x="-22.86" y="-13.14" transform="matrix(-0.7161 -0.0022 0.0022 -0.7161 17.2168 35.7266)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_30_" x="-22.86" y="-13.14" transform="matrix(-0.7161 -0.0022 0.0022 -0.7161 17.2168 13.1289)" overflow="visible"/></svg>'
        },
        router: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="71px" height="74.074px" viewBox="0 0 71 74.074" enable-background="new 0 0 71 74.074" xml:space="preserve"><symbol id="Arrow_25" viewBox="-22.86 -13.14 45.721 26.279"><polygon fill="none" points="-22.86,-13.14 22.86,-13.14 22.86,13.14 -22.86,13.14"/><polygon class="white" fill="#FFFFFF" points="-20.298,-2.933 5.125,-2.933 5.125,-9.242 14.827,0.001 5.125,9.242 5.125,2.934 -20.298,2.934"/></symbol><circle  class="bg" stroke-miterlimit="10" cx="35.977" cy="36.896" r="31.121" /><use xlink:href="#Arrow_25" width="45.721" height="26.279" x="-22.86" y="-13.14" transform="matrix(0.4768 0.5685 0.5685 -0.4768 26.4009 25.2617)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" x="-22.86" y="-13.14" transform="matrix(0.6118 -0.4199 -0.4199 -0.6118 50.9985 25.4111)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" x="-22.86" y="-13.14" transform="matrix(-0.4537 -0.587 -0.587 0.4537 45.1548 49.0225)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" x="-22.86" y="-13.14" transform="matrix(-0.587 0.4537 0.4537 0.587 21.7271 48.002)" overflow="visible"/></svg>'
        },
        accesspoint: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="51.627px" height="41.148px" viewBox="0 0 51.627 41.148" enable-background="new 0 0 51.627 41.148" xml:space="preserve"><g id="Layer_1"></g><g id="Layer_2"></g><g id="Layer_4"></g><g id="Layer_5"></g><g id="Layer_6"></g><g id="Layer_7"></g><g id="Layer_8"> <rect x="0.5" y="0.5"  class="bg" stroke-miterlimit="10" width="50.627" height="40.148" /> <g> <path fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-miterlimit="1" d="M51.588,20.932c0,0-5.796,20.432-12.771-0.044c-6.961-20.475-12.737,0.127-12.737,0.127s-5.781,20.442-12.748-0.034C6.359,0.5,0.582,20.917,0.582,20.917"/> <path fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-miterlimit="1" d="M0.585,21.036c0,0,5.799,20.416,12.774-0.061c6.965-20.476,12.774-0.044,12.774-0.044s5.794,20.432,12.758-0.044c6.968-20.475,12.745,0.127,12.745,0.127"/> </g></g><g id="Layer_3"></g></svg>'
        },
        asr1000series: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="93.013px" viewBox="0 0 100 93.013" enable-background="new 0 0 100 93.013" xml:space="preserve"><g id="Layer_3">  <g>  <g>  <g>  <polygon class="bg" points="30.109,93.013 2.865,65.77 2.865,27.242 30.109,0 68.636,0 95.879,27.242 95.879,65.77 68.636,93.013 "/>  </g>  </g>  <g id="XMLID_20_">  <g> <rect x="10.402" y="14.682" transform="matrix(-0.6426 -0.7662 0.7662 -0.6426 35.7615 74.6585)" fill="none" width="49.782" height="28.614"/>  </g>  <g>  <g> <polygon fill="#FFFFFF" points="18.645,14.107 36.433,35.317 31.17,39.732 45.668,41.357 46.589,26.797 41.326,31.213 23.538,10.004 "/>  </g>  </g>  </g>  <g id="XMLID_19_">  <g> <rect x="46.493" y="14.898" transform="matrix(-0.8245 0.5658 -0.5658 -0.8245 146.7636 12.8944)" fill="none" width="49.779" height="28.614"/>  </g>  <g>  <g> <polygon fill="#FFFFFF" points="54.968,44.343 77.79,28.681 81.676,34.347 84.691,20.069 70.289,17.751 74.176,23.416 51.353,39.076 "/>  </g>  </g>  </g>  <g id="XMLID_18_">  <g> <rect x="37.924" y="49.548" transform="matrix(0.6115 0.7912 -0.7912 0.6115 74.9172 -24.8901)" fill="none" width="49.765" height="28.605"/>  </g>  <g>  <g> <polygon fill="#FFFFFF" points="78.845,79.381 61.922,57.486 67.355,53.284 52.936,51.081 51.437,65.59 56.868,61.391 73.793,83.285 "/>  </g>  </g>  </g>  <g id="XMLID_17_">  <g> <rect x="3.55" y="48.051" transform="matrix(0.7912 -0.6116 0.6116 0.7912 -32.1959 30.4087)" fill="none" width="49.767" height="28.604"/>  </g>  <g>  <g> <polygon fill="#FFFFFF" points="43.963,46.315 22.068,63.239 17.867,57.805 15.664,72.224 30.173,73.724 25.973,68.292 47.867,51.367 "/>  </g>  </g>  </g>  <g opacity="0.6">  <g>  <polygon fill="#204B7F" points="30.109,93.013 2.865,65.77 2.865,58.168 95.879,58.499 95.879,65.77 68.636,93.013 "/>  </g>  </g>  <g>  <g>  <path fill="#FAFCFC" d="M40.933,83.226c0.978,0.676,2.042,1.212,3.192,1.61l-1.469,2.713c-0.604-0.172-1.191-0.409-1.764-0.713 c-0.127-0.061-1.012-0.623-2.654-1.688c-1.294,0.547-2.727,0.817-4.297,0.817c-3.035,0-5.412-0.861-7.131-2.583 c-1.721-1.725-2.58-4.146-2.58-7.264c0-3.109,0.861-5.526,2.585-7.255c1.724-1.728,4.064-2.592,7.019-2.592 c2.928,0,5.248,0.864,6.963,2.592c1.715,1.729,2.572,4.146,2.572,7.255c0,1.646-0.237,3.092-0.713,4.339 C42.297,81.41,41.722,82.332,40.933,83.226z M37.727,81.054c0.512-0.578,0.896-1.28,1.151-2.104 c0.256-0.822,0.385-1.766,0.385-2.831c0-2.2-0.503-3.843-1.509-4.93s-2.322-1.629-3.947-1.629c-1.626,0-2.943,0.546-3.953,1.636 c-1.01,1.092-1.514,2.732-1.514,4.923c0,2.227,0.504,3.892,1.514,4.996c1.01,1.103,2.289,1.655,3.832,1.655 c0.573,0,1.117-0.09,1.629-0.272c-0.807-0.512-1.629-0.908-2.463-1.194l1.116-2.197C35.279,79.539,36.532,80.189,37.727,81.054z "/>  </g>  <g>  <path fill="#FAFCFC" d="M46.521,85.643V66.598h13.537v3.222h-9.551v4.506h8.244v3.221h-8.244v8.097H46.521z"/>  </g>  <g>  <path fill="#FAFCFC" d="M63.344,85.643V66.598h6.398c2.424,0,4.004,0.094,4.74,0.285c1.131,0.286,2.079,0.906,2.842,1.864 c0.763,0.957,1.145,2.192,1.145,3.707c0,1.169-0.221,2.152-0.66,2.951c-0.439,0.796-0.998,1.422-1.676,1.876 c-0.68,0.455-1.367,0.755-2.067,0.903c-0.952,0.183-2.331,0.271-4.136,0.271h-2.599v7.187H63.344z M67.331,69.819v5.404h2.181 c1.572,0,2.622-0.101,3.152-0.301c0.529-0.198,0.945-0.511,1.246-0.936c0.301-0.423,0.451-0.917,0.451-1.481 c0-0.691-0.212-1.263-0.633-1.714c-0.422-0.449-0.956-0.731-1.604-0.843c-0.476-0.087-1.432-0.13-2.867-0.13H67.331z"/>  </g>  </g>  </g></g></svg>'
        },
        camera: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><g id="Layer_1"></g><g id="Layer_2"></g><g id="Layer_4"></g><g id="Layer_5"> <g> <rect x="10.59" y="1.682"  class="bg" stroke-miterlimit="10" width="44.236" height="31.065"/> <line fill="none" stroke="#FFFFFF" stroke-width="3" x1="54.826" y1="22.15" x2="10.59" y2="22.15"/> <g><path  class="bg" d="M8.743,4.639H1.969C0.882,4.639,0,7.844,0,11.799c0,3.948,0.882,7.151,1.969,7.151h6.774V4.639z"/> </g> <line fill="none"  class="stroke" stroke-width="3" stroke-miterlimit="10" x1="32.755" y1="35.804" x2="32.755" y2="51.48"/> <line fill="none"  class="stroke" stroke-width="3" stroke-miterlimit="10" x1="32.755" y1="35.804" x2="54.804" y2="48.938"/> <line fill="none"  class="stroke" stroke-width="3" stroke-miterlimit="10" x1="32.755" y1="35.804" x2="10.709" y2="48.938"/> <rect x="27.914" y="32.33"  class="bg" width="9.591" height="4.318"/> </g></g><g id="Layer_6"></g><g id="Layer_7"></g><g id="Layer_8"></g><g id="Layer_3"></g></svg>'

        },
        collisiondomain: {
            width: 30,
            height: 30,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="50.688px" height="50.687px" viewBox="0 0 50.688 50.687" enable-background="new 0 0 50.688 50.687" xml:space="preserve"><g id="Layer_1"></g><g id="Layer_2"></g><g id="Layer_4"> <rect  class="bg" width="50.688" height="50.687" /> <g> <path class="white" fill="#FFFFFF" d="M5.456,5.187V45.82h29.125V5.187H5.456z M32.413,43.763H7.627V7.243h24.786V43.763z"/> <rect x="21.7" y="9.886" class="white" fill="#FFFFFF" width="2.057" height="31.323"/> <rect x="27.11" y="9.886" class="white" fill="#FFFFFF" width="2.058" height="31.323"/> <rect x="16.287" y="9.886" class="white" fill="#FFFFFF" width="2.057" height="31.323"/> <rect x="10.876" y="9.886" class="white" fill="#FFFFFF" width="2.055" height="31.323"/> </g></g><g id="Layer_5"></g><g id="Layer_6"></g><g id="Layer_7"></g><g id="Layer_8"></g><g id="Layer_3"></g></svg>'

        },
        multilayerswitch: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100.5px" height="100.712px" viewBox="0 0 100.5 100.712" enable-background="new 0 0 100.5 100.712" xml:space="preserve"><g id="Layer_3">  <g id="Arrow_25_11_">  </g>  <g id="Arrow_25_10_">  </g>  <g id="Arrow_25_9_">  </g>  <g id="Arrow_25_8_">  </g>  <g>  <g>  <g>  <rect class="bg" width="90.644" height="90.641"/>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="46.103,34.12 46.103,16.275 49.126,16.275 44.665,9.542 40.198,16.275 43.228,16.275 43.228,34.12 46.103,34.12 "/>  </g>  <g> <polyline fill="#FFFFFF" points="36.998,36.694 24.389,24.081 26.526,21.938 18.607,20.335 20.209,28.256 22.349,26.117 34.962,38.729 36.998,36.694 "/>  </g>  <g> <polyline fill="#FFFFFF" points="32.384,44.961 14.546,44.961 14.546,41.928 7.808,46.393 14.546,50.857 14.546,47.833 32.384,47.833 32.384,44.961 "/>  </g>  <g> <polyline fill="#FFFFFF" points="34.962,54.059 22.349,66.673 20.209,64.532 18.607,72.454 26.526,70.852 24.389,68.706 36.998,56.092 34.962,54.059 "/>  </g>  <g> <polyline fill="#FFFFFF" points="43.228,58.669 43.228,76.516 40.198,76.516 44.665,83.245 49.126,76.516 46.103,76.516 46.103,58.669 43.228,58.669 "/>  </g>  <g> <polyline fill="#FFFFFF" points="56.945,47.833 74.784,47.833 74.784,50.857 81.521,46.393 74.784,41.928 74.784,44.961 56.945,44.961 56.945,47.833 "/>  </g>  <g> <polyline fill="#FFFFFF" points="54.366,38.729 66.981,26.117 69.124,28.256 70.726,20.335 62.807,21.938 64.94,24.081 52.325,36.694 54.366,38.729 "/>  </g>  <g> <path fill="#FFFFFF" d="M56.727,64.779c9.853-6.895,12.246-20.469,5.347-30.311c-6.895-9.852-20.469-12.242-30.31-5.345 c-9.843,6.894-12.242,20.467-5.349,30.316C33.308,69.278,46.881,71.671,56.727,64.779z"/> <path class="bg" d="M44.263,69.197h-0.002c-7.262-0.001-14.081-3.545-18.239-9.48c-7.034-10.049-4.581-23.949,5.466-30.987 c3.76-2.635,8.165-4.027,12.74-4.027c7.263,0,14.081,3.548,18.24,9.49c3.41,4.865,4.721,10.768,3.688,16.62 c-1.031,5.853-4.283,10.953-9.152,14.361C53.242,67.806,48.837,69.197,44.263,69.197z M44.228,25.665 c-4.377,0-8.591,1.332-12.188,3.854c-9.613,6.732-11.959,20.032-5.23,29.646c3.979,5.68,10.502,9.07,17.451,9.07h0.002 c4.375,0,8.59-1.331,12.188-3.85c4.66-3.261,7.77-8.14,8.758-13.739c0.987-5.599-0.266-11.246-3.529-15.9 C57.7,29.059,51.177,25.665,44.228,25.665z"/>  </g>  </g>  </g>  <g>  <g>  <g> <rect x="61.139" y="61.345" fill="#FFFFFF" width="38.861" height="38.867"/>  </g>  <g> <path class="bg" d="M100.5,100.712H60.639V60.845H100.5V100.712z M61.639,99.712H99.5V61.845H61.639V99.712z"/>  </g>  </g>  <g>  <g> <rect x="65.86" y="65.414" class="bg" width="11.133" height="6.783"/>  </g>  <g> <rect x="85.267" y="65.414" class="bg" width="11.133" height="6.783"/>  </g>  <g> <rect x="65.86" y="88.997" class="bg" width="11.133" height="6.784"/>  </g>  <g> <rect x="85.267" y="88.997" class="bg" width="11.133" height="6.784"/>  </g>  <g> <line class="bg" x1="73.61" y1="68.81" x2="87.329" y2="68.81"/> <rect x="73.61" y="68.31" class="bg" width="13.719" height="1"/>  </g>  <g> <line class="bg" x1="73.61" y1="92.393" x2="87.329" y2="92.393"/> <rect x="73.61" y="91.893" class="bg" width="13.719" height="1"/>  </g>  <g> <line class="bg" x1="71.441" y1="89.679" x2="92.919" y2="71.549"/>   <rect x="81.662" y="66.56" transform="matrix(0.6463 0.7631 -0.7631 0.6463 90.5853 -34.1974)" class="bg" width="1.037" height="28.107"/>  </g>  </g>  </g>  </g></g></svg>'

        },
        nexus5000: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="51.99px" height="51.594px" viewBox="0 0 51.99 51.594" enable-background="new 0 0 51.99 51.594" xml:space="preserve"><symbol id="Arrow_25" viewBox="-22.86 -13.14 45.721 26.279"> <polygon fill="none" points="-22.86,-13.14 22.86,-13.14 22.86,13.14 -22.86,13.14 "/> <g> <polygon class="white" fill="#FFFFFF" points="-20.298,-2.933 5.125,-2.933 5.125,-9.242 14.827,0.001 5.125,9.242 5.125,2.934 -20.298,2.934 "/> </g></symbol><g id="Layer_1"></g><g id="Layer_2"> <g> <rect x="0.5" y="0.5"  class="bg" stroke-miterlimit="10" width="47.636" height="47.635"/> <use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_64_" x="-22.86" y="-13.14" transform="matrix(0.5685 -0.0017 -0.0017 -0.5685 33.8271 19.4961)" overflow="visible"/> <use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_63_" x="-22.86" y="-13.14" transform="matrix(0.5685 -0.0017 -0.0017 -0.5685 33.8271 37.4375)" overflow="visible"/> <use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_62_" x="-22.86" y="-13.14" transform="matrix(-0.5685 -0.0017 0.0017 -0.5685 13.7725 28.4668)" overflow="visible"/> <use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_61_" x="-22.86" y="-13.14" transform="matrix(-0.5685 -0.0017 0.0017 -0.5685 13.7725 10.5264)" overflow="visible"/> </g> <rect x="31.51" y="31.111" fill="#FFFFFF"  class="white stroke" stroke-miterlimit="10" width="20.48" height="20.482"/> <polygon  class="bg" stroke-miterlimit="10" points="38.838,41.994 34.55,41.994 34.55,43.111 32.934,41.461 34.55,39.814 34.55,40.932 38.838,40.932 "/> <polygon  class="bg" stroke-miterlimit="10" points="41.263,38.484 41.263,34.156 40.153,34.156 41.787,32.52 43.418,34.156 42.314,34.156 42.314,38.484 "/> <polygon  class="bg" stroke-miterlimit="10" points="41.263,44.314 41.263,48.645 40.153,48.645 41.787,50.277 43.418,48.645 42.314,48.645 42.314,44.314 "/> <polygon  class="bg" stroke-miterlimit="10" points="44.735,40.932 49.023,40.932 49.023,39.814 50.642,41.461 49.023,43.111 49.023,41.994 44.735,41.994 "/> <path  class="bg" d="M48.685,34.514c-0.805-0.861-4.502,1.498-8.255,5.266 c-3.756,3.766-6.146,7.514-5.342,8.373c0.806,0.859,4.503-1.5,8.258-5.266C47.099,39.121,49.49,35.369,48.685,34.514z M48.471,48.219c0.851-0.812-1.485-4.547-5.217-8.338c-3.729-3.791-7.442-6.205-8.292-5.395c-0.849,0.815,1.486,4.549,5.217,8.34 C43.908,46.617,47.619,49.031,48.471,48.219z"/> <path class="white" fill="#FFFFFF" stroke="#FFFFFF" stroke-miterlimit="10" d="M43.547,38.945c1.414,1.004,1.759,2.973,0.767,4.4 c-0.991,1.434-2.941,1.777-4.358,0.777c-1.416-1-1.759-2.971-0.769-4.398C40.179,38.291,42.13,37.945,43.547,38.945"/></g><g id="Layer_4"></g><g id="Layer_5"></g><g id="Layer_6"></g><g id="Layer_7"></g><g id="Layer_8"></g><g id="Layer_3"></g></svg>'
        },
        pc: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="63.196px" height="49.335px" viewBox="0 0 63.196 49.335" enable-background="new 0 0 63.196 49.335" xml:space="preserve"><g id="Layer_1"></g><g id="Layer_2"></g><g id="Layer_4"></g><g id="Layer_5"> <path  class="bg" d="M63.196,40.307c0,1.077-0.874,1.951-1.95,1.951H1.95c-1.077,0-1.95-0.874-1.95-1.951V1.95 C0,0.873,0.873,0,1.95,0h59.296c1.076,0,1.95,0.873,1.95,1.95V40.307z"/> <rect x="5.673" y="5.265" fill="#E9FBFF" width="51.85" height="31.921"/> <polygon  class="bg" points="31.599,39.698 40.659,48.76 22.536,48.76 "/></g><g id="Layer_6"></g><g id="Layer_7"></g><g id="Layer_8"></g><g id="Layer_3"></g></svg>'

        },
        phone: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="51.573px" height="46.913px" viewBox="0 0 51.573 46.913" enable-background="new 0 0 51.573 46.913" xml:space="preserve"><g id="Layer_1"></g><g id="Layer_2"></g><g id="Layer_4"></g><g id="Layer_5"> <polygon  class="bg" stroke-miterlimit="10" points="17.233,0.5 17.044,0.5 0.5,0.5 0.5,46.413 17.044,46.413 17.233,46.413 51.073,46.413 51.073,0.5 "/> <rect x="20.694" y="6.43" fill="#E9FBFF" width="24.632" height="18.019"/> <path fill="#EEFDFF" d="M6.843,7.904c0.201-0.874,0.822-1.74,4.668-1.74c4.392,0,4.735,0.87,5.08,1.74 c0.342,0.871-0.962,13.912-0.962,15.933c0,2.019,1.269,16.252,0.479,17.021c-0.788,0.77-0.822,1.071-4.392,1.071 c-3.848,0-4.154-0.368-4.874-1.071C6.12,40.154,7.528,27.125,7.528,23.837C7.528,21.816,6.578,9.043,6.843,7.904z"/> <rect x="29.743" y="28.376" class="white" fill="#FFFFFF" width="14.521" height="1.86"/> <rect x="29.743" y="34.223" class="white" fill="#FFFFFF" width="14.521" height="1.86"/> <rect x="29.743" y="40.068" class="white" fill="#FFFFFF" width="14.521" height="1.86"/> <rect x="22.446" y="34.754" class="white" fill="#FFFFFF" width="5.502" height="1.86"/> <rect x="22.446" y="40.068" class="white" fill="#FFFFFF" width="5.502" height="1.86"/></g><g id="Layer_6"></g><g id="Layer_7"></g><g id="Layer_8"></g><g id="Layer_3"></g></svg>'

        },
        servicerouter: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="52.921px" height="54.799px" viewBox="0 0 52.921 54.799" enable-background="new 0 0 52.921 54.799" xml:space="preserve"><symbol id="Arrow_25" viewBox="-22.86 -13.14 45.721 26.279"> <polygon fill="none" points="-22.86,-13.14 22.86,-13.14 22.86,13.14 -22.86,13.14 "/> <g> <polygon class="white" fill="#FFFFFF" points="-20.298,-2.933 5.125,-2.933 5.125,-9.242 14.827,0.001 5.125,9.242 5.125,2.934 -20.298,2.934 "/> </g></symbol><g id="Layer_5"> <circle  class="bg" stroke-miterlimit="10" cx="24.528" cy="24.529" r="24.028" /><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_24_" x="-22.86" y="-13.14" transform="matrix(0.3786 0.4514 0.4514 -0.3786 16.9238 15.291)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_23_" x="-22.86" y="-13.14" transform="matrix(0.4858 -0.3334 -0.3334 -0.4858 36.4551 15.4097)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_22_" x="-22.86" y="-13.14" transform="matrix(-0.3602 -0.4661 -0.4661 0.3602 31.8154 34.1582)" overflow="visible"/><use xlink:href="#Arrow_25" width="45.721" height="26.279" id="XMLID_21_" x="-22.86" y="-13.14" transform="matrix(-0.4661 0.3602 0.3602 0.4661 13.2129 33.3477)" overflow="visible"/></g><g id="Layer_6"> <rect x="32.764" y="34.643" fill="#FFFFFF"  class="white stroke" stroke-miterlimit="10" width="20.157" height="20.156"/> <rect x="35.821" y="40.281" fill-rule="evenodd" clip-rule="evenodd" fill="#2FBFE9" width="5.501" height="8.723"/> <rect x="44.518" y="40.281" fill-rule="evenodd" clip-rule="evenodd"  class="bg" width="5.501" height="8.723"/> <rect x="35.666" y="40.281"  class="bg" width="5.501" height="8.723"/> <rect x="34.908" y="50.922" fill-rule="evenodd" clip-rule="evenodd"  class="bg" width="15.989" height="1.445"/> <rect x="34.848" y="37.287" fill-rule="evenodd" clip-rule="evenodd"  class="bg" width="15.989" height="1.445"/></g><g id="Layer_7"></g><g id="Layer_8"></g><g id="Layer_3"></g></svg>'

        },
        tablet: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="37.605px" height="49.581px" viewBox="0 0 37.605 49.581" enable-background="new 0 0 37.605 49.581" xml:space="preserve"><g id="Layer_5"> <g> <g><path  class="bg" d="M1.939,49.581C0.869,49.581,0,48.713,0,47.646V1.936C0,0.867,0.869,0,1.939,0h33.729 c1.067,0,1.937,0.867,1.937,1.936v45.71c0,1.067-0.869,1.936-1.937,1.936H1.939z"/><rect x="3.862" y="5.431" fill="#E9FBFF" width="29.884" height="37.841"/><g> <g> <circle fill="#FCFCFC" stroke="#F9F9F9" stroke-miterlimit="10" cx="18.847" cy="46.486" r="1.152"/> </g></g> </g> </g></g></svg>'
        },
        server: {
            width: 40,
            height: 40,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="32.628px" height="50.34px" viewBox="0 0 32.628 50.34" enable-background="new 0 0 32.628 50.34" xml:space="preserve"><g id="Layer_7"> <g> <rect  class="bg" width="32.628" height="50.34"/> <rect x="4.839" y="11.783" class="white" fill="#FFFFFF" width="22.952" height="1.513"/> <rect x="4.839" y="6.085" class="white" fill="#FFFFFF" width="22.952" height="1.512"/> <rect x="4.839" y="17.481" class="white" fill="#FFFFFF" width="22.952" height="1.513"/> <rect x="4.839" y="23.178" class="white" fill="#FFFFFF" width="22.952" height="1.513"/> <rect x="23.127" y="28.367" class="white" fill="#FFFFFF" width="2.914" height="1.513"/> <rect x="18.805" y="28.367" class="white" fill="#FFFFFF" width="2.911" height="1.513"/> <rect x="6.72" y="37.167" class="white" fill="#FFFFFF" width="1.224" height="3.566"/> <rect x="10.209" y="37.167" class="white" fill="#FFFFFF" width="1.225" height="3.566"/> <rect x="13.699" y="37.167" class="white" fill="#FFFFFF" width="1.223" height="3.566"/> <rect x="17.188" y="37.167" class="white" fill="#FFFFFF" width="1.224" height="3.566"/> <rect x="20.675" y="37.167" class="white" fill="#FFFFFF" width="1.227" height="3.566"/> <rect x="24.166" y="37.167" class="white" fill="#FFFFFF" width="1.225" height="3.566"/> </g></g><g id="Layer_8"></g><g id="Layer_3"></g></svg>'
        },
        voiceenabledrouter: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + LINK + ' x="0px" y="0px" width="53.252px" height="55.426px" viewBox="0 0 53.252 55.426" enable-background="new 0 0 53.252 55.426" xml:space="preserve"><g id="Layer_5"> <g> <g><g> <polyline class="white" fill="#FFFFFF" points="25.022,19.064 25.022,9.343 26.671,9.343 24.24,5.674 21.807,9.343 23.456,9.343 23.456,19.064 25.022,19.064 "/></g><g> <polyline class="white" fill="#FFFFFF" points="20.063,20.469 13.193,13.596 14.357,12.429 10.044,11.555 10.917,15.87 12.082,14.706 18.954,21.576 20.063,20.469 "/></g><g> <polyline class="white" fill="#FFFFFF" points="17.549,24.973 7.83,24.973 7.83,23.318 4.159,25.751 7.83,28.185 7.83,26.535 17.549,26.535 17.549,24.973 "/></g><g> <polyline class="white" fill="#FFFFFF" points="18.954,29.928 12.082,36.801 10.917,35.635 10.044,39.951 14.357,39.078 13.193,37.908 20.063,31.036 18.954,29.928 "/></g><g> <polyline class="white" fill="#FFFFFF" points="23.456,32.439 23.456,42.162 21.807,42.162 24.24,45.83 26.671,42.162 25.022,42.162 25.022,32.439 23.456,32.439 "/></g><g> <polyline class="white" fill="#FFFFFF" points="28.413,31.036 35.286,37.908 34.124,39.078 38.438,39.951 37.564,35.635 36.399,36.801 29.525,29.928 28.413,31.036 "/></g><g> <polyline class="white" fill="#FFFFFF" points="30.931,26.535 40.649,26.535 40.649,28.185 44.32,25.751 40.649,23.318 40.649,24.973 30.931,24.973 30.931,26.535 "/></g><g> <polyline class="white" fill="#FFFFFF" points="29.525,21.576 36.399,14.706 37.564,15.87 38.438,11.555 34.124,12.429 35.286,13.596 28.413,20.469 29.525,21.576 "/></g><g> <path class="white" fill="#FFFFFF" d="M30.812,35.769c5.366-3.756,6.672-11.15,2.912-16.514c-3.754-5.367-11.15-6.669-16.513-2.912 c-5.362,3.756-6.669,11.15-2.913,16.517C18.053,38.22,25.447,39.523,30.812,35.769z"/> <path fill="#32B6E9" d="M24.021,38.395C24.021,38.395,24.021,38.395,24.021,38.395c-4.029,0-7.812-1.966-10.118-5.259 c-3.9-5.574-2.541-13.284,3.031-17.187c2.086-1.461,4.529-2.234,7.067-2.234c4.029,0,7.811,1.968,10.116,5.264 c1.892,2.699,2.618,5.973,2.046,9.219c-0.573,3.246-2.376,6.074-5.076,7.965C29.002,37.623,26.559,38.395,24.021,38.395z M24.002,14.677c-2.339,0-4.592,0.712-6.515,2.06c-5.138,3.599-6.392,10.708-2.795,15.846c2.126,3.036,5.613,4.849,9.328,4.849 c0,0,0,0,0.001,0c2.339,0,4.591-0.711,6.514-2.058c2.49-1.742,4.152-4.351,4.681-7.343c0.528-2.993-0.142-6.012-1.887-8.5 C31.204,16.492,27.717,14.677,24.002,14.677z"/></g> </g> </g> <g> <circle  class="bg" cx="24.529" cy="24.529" r="24.029"/> <path  class="bg" d="M24.529,49.057C11.004,49.057,0,38.054,0,24.529C0,11.004,11.004,0,24.529,0s24.528,11.004,24.528,24.529C49.058,38.054,38.055,49.057,24.529,49.057z M24.529,1C11.556,1,1,11.555,1,24.529c0,12.973,10.556,23.527,23.529,23.527s23.528-10.555,23.528-23.527C48.058,11.555,37.503,1,24.529,1z"/> </g> <g id="Arrow_25_7_"> <rect x="4.038" y="8.017" transform="matrix(-0.6426 -0.7662 0.7662 -0.6426 16.2376 38.6659)" fill="none" width="26.197" height="15.058"/> <g><polygon class="white" fill="#FFFFFF" points="8.376,7.715 17.736,18.875 14.967,21.199 22.597,22.055 23.081,14.393 20.312,16.716 10.951,5.555 "/> </g> </g> <g id="Arrow_25_6_"> <rect x="23.029" y="8.131" transform="matrix(-0.8245 0.5658 -0.5658 -0.8245 74.775 8.1289)" fill="none" width="26.196" height="15.057"/> <g><polygon class="white" fill="#FFFFFF" points="27.489,23.626 39.499,15.383 41.544,18.364 43.131,10.852 35.552,9.632 37.597,12.612 25.587,20.854 "/> </g> </g> <g id="Arrow_25_5_"> <rect x="18.521" y="26.364" transform="matrix(0.6115 0.7912 -0.7912 0.6115 39.0956 -11.8493)" fill="none" width="26.189" height="15.053"/> <g><polygon class="white" fill="#FFFFFF" points="40.055,42.062 31.149,30.541 34.009,28.33 26.421,27.171 25.632,34.806 28.49,32.596 37.396,44.117 "/> </g> </g> <g id="Arrow_25_4_"> <rect x="0.433" y="25.577" transform="matrix(0.7912 -0.6115 0.6115 0.7912 -17.42 15.1844)" fill="none" width="26.189" height="15.053"/> <g><polygon class="white" fill="#FFFFFF" points="21.699,24.664 10.178,33.569 7.967,30.71 6.808,38.298 14.442,39.087 12.232,36.229 23.754,27.322 "/> </g> </g> <g> <circle class="white" fill="#FFFFFF" cx="42.666" cy="44.138" r="10.586"/> <path  class="bg" d="M42.666,55.225c-6.113,0-11.086-4.974-11.086-11.087s4.973-11.086,11.086-11.086s11.086,4.973,11.086,11.086S48.779,55.225,42.666,55.225z M42.666,34.052c-5.562,0-10.086,4.524-10.086,10.086s4.524,10.087,10.086,10.087s10.086-4.525,10.086-10.087S48.228,34.052,42.666,34.052z"/> </g> <g> <path  class="bg" d="M36.381,39.281h3.862l2.691,8.605l2.656-8.605h3.75l-4.439,11.957h-4.005L36.381,39.281z"/> </g></g></svg>'

        },
        openflow: {
            width: 42,
            height: 42,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="54px" height="54px" viewBox="0 0 54 54" enable-background="new 0 0 54 54" xml:space="preserve"><rect y="0"  class="bg" width="47.693" height="47.693"/><g> <g> <path class="white" fill="#FFFFFF" d="M30.713,34.846l-2.309-4.256l-0.821,2.213c-0.526-0.268-1.546-0.955-2.239-2.042 c-0.896-1.407-1.219-3.474-0.916-5.002c0.334-1.341,1.414-2.732,2.602-3.623c1.499-1.13,4.131-1.503,6.456-1.675 c0-0.011-5.394,1.268-6.56,3.882c-0.756,1.696-0.781,3.396,0.498,5.317c4.047-1.395,4.85-2.511,6.604-8.958 c0.157-0.578,0.196-1.31,0.108-1.902c-3.271-0.465-7.029-0.848-10.078,0.718c-0.871,0.446-1.788,1.03-2.514,1.69 c-3.277,2.987-4.646,7.888-2.177,11.799c1.418,2.244,3.659,3.818,5.778,5.345c0.089,0.065-0.547,1.851-0.613,2.077l2.02-0.881 l5.617-2.54L30.713,34.846z"/> </g> <g> <path class="white" fill="#FFFFFF" d="M16.722,21.586c-0.563-1.342-0.744-2.97-0.413-4.641c0.739-3.744,3.756-6.314,6.722-5.728 c2.311,0.458,3.912,2.699,4.162,5.436c2.355,0.122,4.728,0.836,6.926,1.62c0.373-6.672-3.673-12.654-9.743-13.854 C17.661,3.092,10.991,8.107,9.508,15.6c-1.143,5.779,1.136,11.355,5.313,14.221C14.142,26.871,14.972,23.938,16.722,21.586z"/> </g></g><g> <g> <rect x="32.495" y="32.574" class="white" fill="#FFFFFF" width="20.423" height="20.426"/> <rect x="32.495" y="32.574" fill="none"  class="stroke" stroke-miterlimit="10" width="20.423" height="20.426"/> </g></g><g id="Arrow_25_11_"> <g> <polygon  class="bg" points="42.172,40.309 42.176,41.854 48.885,41.834 48.893,43.5 51.445,41.054 48.879,38.617 48.881,40.287 "/> <polygon  class="bg" points="48.881,48.621 42.172,48.64 42.176,50.188 48.885,50.168 48.893,51.832 51.445,49.387 48.879,46.949 "/> <polygon  class="bg" points="43.575,44.472 36.866,44.451 36.87,42.785 34.301,45.219 36.854,47.67 36.862,45.998 43.573,46.024 "/> <polygon  class="bg" points="36.862,37.668 43.573,37.691 43.575,36.139 36.866,36.119 36.87,34.453 34.301,36.886 36.854,39.336 "/> </g></g></svg>'
        },
        wlc: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="97.729px" height="100.5px" viewBox="0 0 97.729 100.5" enable-background="new 0 0 97.729 100.5" xml:space="preserve"><symbol  id="Arrow_2" viewBox="-22.86 -13.14 45.72 26.279">  <polygon fill="none" points="-22.86,-13.14 22.86,-13.14 22.86,13.14 -22.86,13.14 "/>  <g>  <polygon fill="#FFFFFF" points="-20.298,-2.933 5.125,-2.933 5.125,-9.242 14.827,0.001 5.125,9.242 5.125,2.934 -20.298,2.934 "/>  </g></symbol><g id="Layer_3">  <g>  <rect x="1.054" y="3.622" class="bg" width="85.997" height="85.994"/>  <g>  <g> <use xlink:href="#Arrow_2"  width="45.72" height="26.279" x="-22.86" y="-13.14" transform="matrix(0 -0.7752 -0.7752 0 44.0518 65.4111)" overflow="visible"/> <use xlink:href="#Arrow_2"  width="45.72" height="26.279" x="-22.86" y="-13.14" transform="matrix(0.5481 -0.5481 -0.5481 -0.5481 19.7305 65.4111)" overflow="visible"/>  </g> <use xlink:href="#Arrow_2"  width="45.72" height="26.279" id="XMLID_126_" x="-22.86" y="-13.14" transform="matrix(-0.0035 -1.1233 -1.1233 0.0035 44.0527 25.7236)" overflow="visible"/>  </g>  <g>  <rect x="57.755" y="60.521" fill="#FFFFFF" width="39.475" height="39.479"/>  <rect x="57.755" y="60.521" fill="none" class="stroke" stroke-miterlimit="10" width="39.475" height="39.479"/>  </g>  <g>  <g>  <path class="bg" d="M91.282,82.053c0.324,0.188,0.372,0.534,0.272,0.805c-1.053,2.592-3.319,9.316-6.654,9.415 c-0.035,0-0.062,0-0.088,0c-2.615,0-4.994-3.649-7.284-11.146c-2.604-8.513-4.829-10.329-6.259-10.329 c-0.016,0-0.034,0.006-0.05,0.006c-2.903,0.077-5.396,7.402-6.111,10.217c-0.083,0.335-0.395,0.513-0.678,0.424 c-0.294-0.089-0.462-0.424-0.379-0.749c0.284-1.131,2.911-10.989,7.141-11.117c2.64-0.051,5.055,3.575,7.369,11.161 c2.601,8.495,4.823,10.311,6.255,10.311c0.017,0,0.035,0,0.049,0c2.489-0.071,4.722-6.392,5.702-8.761 C90.705,81.996,90.957,81.864,91.282,82.053z"/>  </g>  <g>  <path class="bg" d="M92.194,83.413c-1.001,0.394-1.909-0.118-2.215-1.257c-0.463-1.714-3.326-9.299-5.114-9.343 c-0.373-0.052-2.463,0.398-5.236,9.482c-2.488,8.171-5.141,11.987-8.329,11.987c-0.04,0-0.075,0-0.113-0.007 c-4.924-0.146-7.686-10.018-8.192-11.992c-0.245-0.978,0.26-1.987,1.137-2.266c0.875-0.287,1.785,0.284,2.032,1.262 c0.997,3.88,3.319,9.284,5.104,9.334c0.341,0,2.471-0.394,5.247-9.493c2.491-8.169,5.143-11.978,8.323-11.978 c0.04,0,0.078,0,0.117,0.007c4.12,0.112,7.908,11.332,8.143,12.249C93.333,82.314,92.984,83.103,92.194,83.413z"/>  </g>  </g>  </g></g></svg>'
        },
        unknown: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="99.021px" height="99.021px" viewBox="0 0 99.021 99.021" enable-background="new 0 0 99.021 99.021" xml:space="preserve"><g id="Layer_3">  <g>  <g id="Layer_3_1_">  <g>  <path class="bg" d="M99.021,49.512c0,27.34-22.167,49.51-49.505,49.51C22.17,99.021,0,76.852,0,49.512 C0,22.167,22.17,0,49.517,0C76.854,0,99.021,22.167,99.021,49.512z"/>  </g>  </g>  <g enable-background="new    ">  <g>  <path fill="#FCFAFA" d="M43.434,85.58l-0.125-0.125V74.537l0.125-0.125h10.824l0.125,0.125v10.918l-0.125,0.125H43.434z   M44.187,65.911l-0.125-0.125c0-10.896,2.819-16.03,11.174-20.347c5.347-2.719,7.837-6.422,7.837-11.654 c0-5.756-4.938-9.475-12.58-9.475c-8.322,0-13.062,3.637-14.087,10.81l-0.124,0.106h-9.787l-0.125-0.144 c1.864-12.028,10.76-18.928,24.404-18.928c12.889,0,22.242,7.415,22.242,17.631c0,8.173-4.417,14.428-13.898,19.685 c-4.496,2.471-5.865,5.348-5.865,12.315l-0.125,0.125H44.187z"/>  <path class="bg" d="M50.774,16.28c13.554,0,22.117,7.905,22.117,17.506c0,8-4.329,14.306-13.835,19.575 c-4.801,2.638-5.93,5.836-5.93,12.425h-8.94v-0.001c0-10.824,2.729-15.906,11.106-20.235c5.739-2.918,7.903-6.776,7.903-11.765 c0-5.741-4.987-9.6-12.704-9.6c-8.283,0-13.177,3.67-14.212,10.916h-9.788C28.375,22.962,37.504,16.28,50.774,16.28   M54.258,74.537v10.918H43.434V74.537H54.258 M50.774,16.03c-13.714,0-22.653,6.938-24.528,19.034l0.248,0.287h9.787 l0.248-0.215c1.014-7.102,5.713-10.701,13.963-10.701c7.566,0,12.455,3.67,12.455,9.35c0,5.251-2.396,8.811-7.768,11.542 c-8.406,4.344-11.243,9.506-11.243,20.458l0.25,0.25l8.94,0.001l0.25-0.25c0-6.912,1.354-9.765,5.799-12.206 c9.527-5.281,13.966-11.571,13.966-19.794C73.142,23.498,63.734,16.03,50.774,16.03L50.774,16.03z M54.258,74.287H43.434 l-0.25,0.25v10.918l0.25,0.25h10.824l0.25-0.25V74.537L54.258,74.287L54.258,74.287z"/>  </g>  </g>  </g></g></svg>'
        },
        cloud: {
            width: 96,
            height: 58,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 111.128 79.276"><g id="Layer_4" transform="matrix(0.89840137,0,0,-0.80074289,45.77195,41.33252)"> <path d="m 56.93,14.529 c 0.609,2.337 0.936,4.785 0.936,7.312 0,15.934 -12.917,28.853 -28.853,28.853 -11.98,0 -22.257,-7.305 -26.618,-17.702 -3.746,4.402 -9.323,7.199 -15.557,7.199 -11.28,0 -20.424,-9.144 -20.424,-20.424 0,-1.939 0.276,-3.814 0.781,-5.59 -9.212,-3.379 -15.776,-12.223 -15.776,-22.609 0,-13.285 10.765,-24.072 24.065,-24.072 H 49.68 c 13.307,0 24.072,10.787 24.072,24.072 0.001,10.774 -7.064,19.889 -16.822,22.961 z" id="path5" fill="#d0d2d3"/></g></svg>'
        },
        collapse: {
            width: 16,
            height: 16,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><g> <path  class="bg" d="M29.207,0.623c-13.873,0-25.125,11.252-25.125,25.117c0,13.873,11.252,25.117,25.125,25.117 c13.872,0,25.117-11.244,25.117-25.117C54.324,11.875,43.079,0.623,29.207,0.623z"/> <path class="white" fill="#FFFFFF" d="M29.207,45.15c-10.705,0-19.417-8.706-19.417-19.41S18.502,6.33,29.207,6.33 c10.696,0,19.409,8.706,19.409,19.41S39.903,45.15,29.207,45.15z"/> <g> <rect x="14.616" y="22.823" fill-rule="evenodd" clip-rule="evenodd"  class="bg" width="29.174" height="5.833"/> </g></g></svg>'
        },
        expand: {
            width: 16,
            height: 16,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><g> <path  class="bg" d="M29.205,0.874c-13.734,0-24.875,11.14-24.875,24.867c0,13.735,11.141,24.867,24.875,24.867 c13.732,0,24.873-11.132,24.873-24.867C54.078,12.014,42.938,0.874,29.205,0.874z"/> <path class="white" fill="#FFFFFF" d="M29.205,44.958c-10.598,0-19.221-8.619-19.221-19.216c0-10.598,8.623-19.217,19.221-19.217 c10.588,0,19.215,8.619,19.215,19.217C48.42,36.339,39.793,44.958,29.205,44.958z"/> <g> <rect x="26.31" y="11.303" fill-rule="evenodd" clip-rule="evenodd"  class="bg" width="5.781" height="28.884"/> <rect x="14.76" y="22.854" fill-rule="evenodd" clip-rule="evenodd"  class="bg" width="28.881" height="5.775"/> </g></g></svg>'
        },
        arrow: {
            width: 16,
            height: 16,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><polyline  class="bg" points="22.728,50.445 48.713,26.091 22.728,1.034 9.694,1.034 35.681,25.705 9.694,50.445 22.728,50.445 "/></svg>'
        },
        groupL: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><g> <path  class="bg" d="M14.902,9.533V5.72h-5.72v3.813H7.276V51.48h9.534V9.533H14.902z M11.089,47.667H9.183V45.76h1.907V47.667z M11.089,43.853H9.183v-1.906h1.907V43.853z M11.089,40.04H9.183v-1.906h1.907V40.04z M11.089,36.226H9.183V34.32h1.907V36.226z M11.089,32.414H9.183v-1.907h1.907V32.414z M11.089,28.6H9.183v-1.907h1.907V28.6z M11.089,24.787H9.183V22.88h1.907V24.787z M11.089,20.973H9.183v-1.907h1.907V20.973z M11.089,17.16H9.183v-1.907h1.907V17.16z M14.902,47.667h-1.906V45.76h1.906V47.667z M14.902,43.853h-1.906v-1.906h1.906V43.853z M14.902,40.04h-1.906v-1.906h1.906V40.04z M14.902,36.226h-1.906V34.32h1.906V36.226z M14.902,32.414h-1.906v-1.907h1.906V32.414z M14.902,28.6h-1.906v-1.907h1.906V28.6z M14.902,24.787h-1.906V22.88h1.906V24.787z M14.902,20.973h-1.906v-1.907h1.906V20.973z M14.902,17.16h-1.906v-1.907h1.906V17.16z"/> <path  class="bg" d="M30.156,5.72v45.76h9.533V0L30.156,5.72z M33.97,47.667h-1.907V45.76h1.907V47.667z M33.97,43.853h-1.907 v-1.906h1.907V43.853z M33.97,40.04h-1.907v-1.906h1.907V40.04z M33.97,36.226h-1.907V34.32h1.907V36.226z M33.97,32.414h-1.907 v-1.907h1.907V32.414z M33.97,28.6h-1.907v-1.907h1.907V28.6z M33.97,24.787h-1.907V22.88h1.907V24.787z M33.97,20.973h-1.907 v-1.907h1.907V20.973z M33.97,17.16h-1.907v-1.907h1.907V17.16z M33.97,13.346h-1.907V11.44h1.907V13.346z M33.97,9.533h-1.907 V7.627h1.907V9.533z M37.783,47.667h-1.907V45.76h1.907V47.667z M37.783,43.853h-1.907v-1.906h1.907V43.853z M37.783,40.04h-1.907 v-1.906h1.907V40.04z M37.783,36.226h-1.907V34.32h1.907V36.226z M37.783,32.414h-1.907v-1.907h1.907V32.414z M37.783,28.6h-1.907 v-1.907h1.907V28.6z M37.783,24.787h-1.907V22.88h1.907V24.787z M37.783,20.973h-1.907v-1.907h1.907V20.973z M37.783,17.16h-1.907 v-1.907h1.907V17.16z M37.783,13.346h-1.907V11.44h1.907V13.346z M37.783,9.533h-1.907V7.627h1.907V9.533z"/> <path  class="bg" d="M18.716,15.253V51.48h9.534V15.253H18.716z M22.529,45.76h-1.907v-1.907h1.907V45.76z M22.529,41.947 h-1.907V40.04h1.907V41.947z M22.529,38.134h-1.907v-1.907h1.907V38.134z M22.529,34.32h-1.907v-1.906h1.907V34.32z M22.529,30.507 h-1.907V28.6h1.907V30.507z M22.529,26.693h-1.907v-1.906h1.907V26.693z M22.529,22.88h-1.907v-1.907h1.907V22.88z M22.529,19.067 h-1.907V17.16h1.907V19.067z M26.343,45.76h-1.907v-1.907h1.907V45.76z M26.343,41.947h-1.907V40.04h1.907V41.947z M26.343,38.134 h-1.907v-1.907h1.907V38.134z M26.343,34.32h-1.907v-1.906h1.907V34.32z M26.343,30.507h-1.907V28.6h1.907V30.507z M26.343,26.693 h-1.907v-1.906h1.907V26.693z M26.343,22.88h-1.907v-1.907h1.907V22.88z M26.343,19.067h-1.907V17.16h1.907V19.067z"/> <path  class="bg" d="M49.223,19.067V17.16h-1.906v1.907h-1.907V17.16h-1.906v1.907h-1.907V51.48h9.534V19.067H49.223z M45.409,45.76h-1.906v-1.907h1.906V45.76z M45.409,41.947h-1.906V40.04h1.906V41.947z M45.409,38.134h-1.906v-1.907h1.906V38.134z M45.409,34.32h-1.906v-1.906h1.906V34.32z M45.409,30.507h-1.906V28.6h1.906V30.507z M45.409,26.693h-1.906v-1.906h1.906V26.693z M45.409,22.88h-1.906v-1.907h1.906V22.88z M49.223,45.76h-1.906v-1.907h1.906V45.76z M49.223,41.947h-1.906V40.04h1.906V41.947z M49.223,38.134h-1.906v-1.907h1.906V38.134z M49.223,34.32h-1.906v-1.906h1.906V34.32z M49.223,30.507h-1.906V28.6h1.906V30.507z M49.223,26.693h-1.906v-1.906h1.906V26.693z M49.223,22.88h-1.906v-1.907h1.906V22.88z"/></g></svg>'
        },
        groupM: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><path  class="bg" d="M14.188,0v51.48h10.725V42.9h8.58v8.58h10.726V0H14.188z M27.058,4.29h4.29v6.435h-4.29V4.29z M27.058,12.87 h4.29v6.435h-4.29V12.87z M27.058,21.45h4.29v6.435h-4.29V21.45z M27.058,30.03h4.29v6.435h-4.29V30.03z M18.478,4.29h4.29v6.435 h-4.29V4.29z M18.478,12.87h4.29v6.435h-4.29V12.87z M18.478,21.45h4.29v6.435h-4.29V21.45z M18.478,30.03h4.29v6.435h-4.29V30.03z M39.928,36.465h-4.289V30.03h4.289V36.465z M39.928,27.885h-4.289V21.45h4.289V27.885z M39.928,19.305h-4.289V12.87h4.289V19.305z M39.928,10.725h-4.289V4.29h4.289V10.725z"/></svg>'
        },
        groupS: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><g> <polygon  class="bg" points="47.923,18.72 47.923,2.341 38.563,2.341 38.563,9.361 29.198,0 3.463,25.74 8.138,25.74 8.138,51.481 22.183,51.481 22.183,32.76 36.223,32.76 36.223,51.481 50.264,51.481 50.264,25.74 54.943,25.74 "/></g></svg>'
        },
        hierarchy: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58.406px" height="51.48px" viewBox="0 0 58.406 51.48" enable-background="new 0 0 58.406 51.48" xml:space="preserve"><g> <g> <path  class="bg" d="M37.631,23.454H21.145V6.972h16.486V23.454z M23.486,21.113h11.805v-11.8H23.486V21.113z"/> </g> <g> <path  class="bg" d="M37.631,44.508H21.145V28.026h16.486V44.508z M23.486,42.167h11.805v-11.8H23.486V42.167z"/> </g> <g> <path  class="bg" d="M57.949,44.508H41.467V28.026h16.482V44.508z M43.808,42.167h11.801v-11.8H43.808V42.167z"/> </g> <g> <path  class="bg" d="M16.939,44.508H0.458V28.026h16.481V44.508z M2.798,42.167h11.8v-11.8h-11.8V42.167z"/> </g> <g> <polygon  class="bg" points="50.881,36.264 48.54,36.264 48.54,16.386 9.866,16.386 9.866,36.264 7.525,36.264 7.525,14.045 50.881,14.045 "/> </g> <g> <rect x="28.218" y="15.216"  class="bg" width="2.341" height="21.049"/> </g></g></svg>'
        },
        cisco10700: {
            width: 36,
            height: 36,
            icon: '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="99.058px" height="98.61px" viewBox="0 0 99.058 98.61" enable-background="new 0 0 99.058 98.61" xml:space="preserve"><g id="Layer_3">  <g>  <g>  <path class="bg" d="M90,45.001c0,24.85-20.148,45-44.996,45C20.15,90.001,0,69.851,0,45.001C0,20.148,20.15,0,45.004,0  C69.852,0,90,20.148,90,45.001z"/>  <g>  <polygon fill="#FFFFFF" points="15.256,13.532 32.78,34.429 27.594,38.777 41.879,40.382 42.787,26.035 37.603,30.387 20.076,9.488 "/>  </g>  <g>  <polygon fill="#FFFFFF" points="74.582,77.858 57.904,56.279 63.259,52.142 49.049,49.969 47.569,64.266 52.924,60.126 69.602,81.709 "/>  </g>  <polygon fill="#FFFFFF" points="44.053,50.253 40.205,45.275 18.624,61.949 14.486,56.595 12.312,70.806 26.612,72.285 22.475,66.931 "/>  <polygon fill="#FFFFFF" points="51.452,44.758 73.943,29.321 77.772,34.904 80.744,20.833 66.55,18.552 70.381,24.133 47.889,39.565 "/>  </g>  <g>  <circle fill="#F9F7F7" class="stroke" stroke-width="2" stroke-miterlimit="10" cx="78.058" cy="77.61" r="20"/>  <polygon class="bg" points="75.11,91.287 89.591,81.348 92.061,84.941 93.972,75.885 84.833,74.413 87.298,78.005 72.817,87.944 "/>  <polygon class="bg" points="64.787,83.05 79.269,73.109 81.735,76.704 83.649,67.645 74.511,66.173 76.978,69.769 62.495,79.705 "/>  </g>  </g></g></svg>'
        },
        xswitch: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="92.376px" height="92.376px" viewBox="0 0 92.376 92.376" enable-background="new 0 0 92.376 92.376" xml:space="preserve"><g id="Layer_3">  <g>  <g>  <g>  <rect class="bg" width="92.376" height="92.376"/>  </g>  </g>  <g>  <g>  <g> <polyline fill="#FFFFFF" points="48.002,34.772 48.002,16.59 51.086,16.59 46.537,9.725 41.983,16.59 45.07,16.59 45.07,34.772 48.002,34.772 "/>  </g>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="38.725,37.4 25.871,24.541 28.051,22.358 19.98,20.723 21.613,28.797 23.796,26.616 36.647,39.473 38.725,37.4 "/>  </g>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="34.021,45.818 15.839,45.818 15.839,42.732 8.977,47.279 15.839,51.834 15.839,48.749 34.021,48.749 34.021,45.818 "/>  </g>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="36.647,55.089 23.796,67.95 21.613,65.769 19.98,73.841 28.051,72.207 25.871,70.021 38.725,57.167 36.647,55.089 "/>  </g>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="45.07,59.791 45.07,77.979 41.983,77.979 46.537,84.839 51.086,77.979 48.002,77.979 48.002,59.791 45.07,59.791 "/>  </g>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="54.344,57.167 67.201,70.021 65.025,72.207 73.094,73.841 71.461,65.769 69.279,67.95 56.425,55.089 54.344,57.167 "/>  </g>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="59.053,48.749 77.232,48.749 77.232,51.834 84.098,47.279 77.232,42.732 77.232,45.818 59.053,45.818 59.053,48.749 "/>  </g>  </g>  <g>  <g> <polyline fill="#FFFFFF" points="56.425,39.473 69.279,26.616 71.461,28.797 73.094,20.723 65.025,22.358 67.201,24.541 54.344,37.4 56.425,39.473 "/>  </g>  </g>  <g>  <g> <path fill="#FFFFFF" d="M58.83,66.016c10.037-7.023,12.479-20.856,5.445-30.888c-7.021-10.042-20.858-12.478-30.889-5.446 c-10.029,7.024-12.473,20.857-5.447,30.895C34.96,70.603,48.793,73.041,58.83,66.016z"/>  </g>  <g> <path class="bg" d="M46.125,70.708L46.125,70.708c-7.465,0-14.471-3.644-18.742-9.742 c-7.227-10.327-4.707-24.608,5.615-31.84c3.863-2.709,8.392-4.141,13.095-4.141c7.464,0,14.47,3.646,18.739,9.755 c3.506,4.998,4.852,11.063,3.791,17.078c-1.062,6.014-4.4,11.252-9.404,14.754C55.354,69.277,50.826,70.708,46.125,70.708z  M46.093,26.342c-4.423,0-8.681,1.348-12.315,3.897c-9.71,6.8-12.08,20.235-5.283,29.946 c4.019,5.739,10.609,9.165,17.631,9.165c4.42,0,8.68-1.345,12.316-3.891c4.706-3.293,7.848-8.222,8.845-13.878 s-0.269-11.361-3.566-16.065C59.703,29.771,53.114,26.342,46.093,26.342z"/>  </g>  </g>  </g>  </g></g></svg>'
        },
        yswitch: {
            width: 36,
            height: 36,
            icon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="96.109px" height="96.497px" viewBox="0 0 96.109 96.497" enable-background="new 0 0 96.109 96.497" xml:space="preserve"><g id="Layer_3">  <g>  <g>  <g>  <g> <rect class="bg" width="87.707" height="87.707"/>  </g>  </g>  <g>  <g> <g> <polyline fill="#FFFFFF" points="45.574,33.018 45.574,15.753 48.504,15.753 44.184,9.236 39.863,15.753 42.793,15.753 42.793,33.018 45.574,33.018 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="36.768,35.512 24.564,23.302 26.633,21.232 18.971,19.68 20.52,27.34 22.592,25.274 34.795,37.478 36.768,35.512 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="32.301,43.505 15.037,43.505 15.037,40.572 8.521,44.892 15.037,49.214 15.037,46.289 32.301,46.289 32.301,43.505 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="34.795,52.308 22.592,64.516 20.52,62.445 18.971,70.109 26.633,68.561 24.564,66.482 36.768,54.278 34.795,52.308 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="42.793,56.772 42.793,74.038 39.863,74.038 44.184,80.555 48.504,74.038 45.574,74.038 45.574,56.772 42.793,56.772 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="56.066,46.289 73.328,46.289 73.328,49.214 79.848,44.892 73.328,40.572 73.328,43.505 56.066,43.505 56.066,46.289 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="53.572,37.478 65.777,25.274 67.85,27.34 69.398,19.68 61.74,21.232 63.805,23.302 51.596,35.512 53.572,37.478 "/> </g>  </g>  <g> <g> <path fill="#FFFFFF" d="M55.857,62.684c9.529-6.67,11.85-19.805,5.17-29.33c-6.666-9.533-19.807-11.847-29.326-5.17 c-9.523,6.67-11.846,19.803-5.174,29.332C33.193,67.035,46.326,69.353,55.857,62.684z"/> </g> <g> <path class="bg" d="M43.795,67.136L43.795,67.136c-7.086,0-13.738-3.459-17.795-9.25 c-6.863-9.805-4.473-23.365,5.332-30.231c3.666-2.571,7.965-3.93,12.432-3.93c7.086,0,13.738,3.462,17.793,9.26 c3.328,4.745,4.605,10.506,3.598,16.217c-1.006,5.71-4.178,10.685-8.928,14.011C52.557,65.779,48.258,67.136,43.795,67.136z M43.764,25.013c-4.199,0-8.242,1.278-11.693,3.697C22.85,35.169,20.6,47.924,27.055,57.146 c3.816,5.448,10.074,8.702,16.74,8.702c4.197,0,8.24-1.278,11.691-3.693c4.469-3.127,7.453-7.808,8.4-13.179 S63.631,38.189,60.5,33.724C56.686,28.269,50.43,25.013,43.764,25.013z"/> </g>  </g>  </g>  </g>  <g>  <g> <rect x="60.517" y="72.934" transform="matrix(-1 0.0048 -0.0048 -1 137.0606 154.538)" fill="none" width="15.654" height="8.999"/>  </g>  </g>  <g>  <g> <rect x="76.781" y="72.938" transform="matrix(1 -0.0053 0.0053 1 -0.4096 0.4499)" fill="none" width="15.647" height="8.991"/>  </g>  </g>  <g>  <g> <rect x="68.932" y="83.21" transform="matrix(0.0061 -1 1 0.0061 -11.419 163.925)" fill="none" width="15.647" height="8.994"/>  </g>  </g>  <g>  <g>  <g> <g> <g> <rect x="60.07" y="60.454" fill="#FFFFFF" width="35.371" height="35.374"/> </g> </g> <g> <g> <path class="bg" d="M96.109,96.497H59.4V59.784h36.709V96.497z M60.74,95.158h34.031V61.124H60.74V95.158z"/> </g> </g>  </g>  </g>  <g>  <g> <g> <polygon class="bg" points="62.398,79.472 71.104,79.429 71.115,81.591 74.42,78.407 71.084,75.261 71.094,77.423 62.389,77.462 "/> </g>  </g>  </g>  <g>  <g>   <rect x="69.928" y="63.239" transform="matrix(-0.0145 0.9999 -0.9999 -0.0145 146.6114 -9.0301)" fill="none" width="15.655" height="8.997"/>  </g>  </g>  <g>  <g> <g> <polygon class="bg" points="78.658,74.702 78.785,65.997 80.943,66.028 77.83,62.662 74.617,65.937 76.777,65.967 76.65,74.672 "/> </g>  </g>  </g>  <g>  <g> <g> <polygon class="bg" points="92.547,77.392 83.846,77.44 83.834,75.281 80.529,78.461 83.865,81.607 83.855,79.445 92.555,79.402 "/> </g>  </g>  </g>  <g>  <g> <g> <polygon class="bg" points="76.795,81.755 76.742,90.453 74.582,90.439 77.725,93.78 80.908,90.479 78.75,90.466 78.803,81.768 "/> </g>  </g>  </g>  </g>  </g></g></svg>'
        },
        zswitch:{
            width: 36,
            height: 36,
            icon:'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="120.614px" height="82.5px" viewBox="0 0 120.614 82.5" enable-background="new 0 0 120.614 82.5" xml:space="preserve"><g id="Layer_6"></g><g id="Layer_7"></g><g id="Layer_8"></g><g id="Layer_3">  <g>  <g>  <g>  <g> <rect x="38.111" class="bg" width="82.503" height="82.5"/>  </g>  </g>  <g>  <g> <g> <polyline fill="#FFFFFF" points="80.98,31.055 80.98,14.814 83.735,14.814 79.674,8.685 75.609,14.814 78.364,14.814 78.364,31.055 80.98,31.055 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="72.696,33.399 61.219,21.918 63.165,19.967 55.957,18.508 57.415,25.716 59.361,23.773 70.842,35.252 72.696,33.399 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="68.496,40.922 52.261,40.922 52.261,38.161 46.126,42.227 52.261,46.289 52.261,43.536 68.496,43.536 68.496,40.922 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="70.842,49.203 59.361,60.685 57.415,58.738 55.957,65.947 63.165,64.489 61.219,62.535 72.696,51.055 70.842,49.203 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="78.364,53.4 78.364,69.644 75.609,69.644 79.674,75.768 83.735,69.644 80.98,69.644 80.98,53.4 78.364,53.4 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="86.646,51.055 98.129,62.535 96.187,64.489 103.395,65.947 101.937,58.738 99.987,60.685 88.503,49.203 86.646,51.055 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="90.853,43.536 107.088,43.536 107.088,46.289 113.219,42.227 107.088,38.161 107.088,40.922 90.853,40.922 90.853,43.536 "/> </g>  </g>  <g> <g> <polyline fill="#FFFFFF" points="88.503,35.252 99.987,23.773 101.937,25.716 103.395,18.508 96.187,19.967 98.129,21.918 86.646,33.399 88.503,35.252 "/> </g>  </g>  <g> <g> <path fill="#FFFFFF" d="M90.651,58.961c8.968-6.275,11.146-18.629,4.868-27.589c-6.275-8.967-18.632-11.142-27.588-4.864 c-8.958,6.276-11.143,18.628-4.868,27.593C69.337,63.057,81.689,65.233,90.651,58.961z"/> </g> <g> <path class="bg" d="M79.307,63.188C79.306,63.188,79.306,63.188,79.307,63.188c-6.679,0-12.947-3.26-16.77-8.718 c-6.467-9.238-4.212-22.02,5.025-28.492c3.456-2.422,7.507-3.701,11.714-3.701c6.678,0,12.947,3.261,16.771,8.724 c3.136,4.477,4.34,9.904,3.391,15.284c-0.949,5.381-3.938,10.07-8.417,13.204C87.563,61.908,83.513,63.188,79.307,63.188z M79.276,23.564c-3.941,0-7.736,1.201-10.974,3.471c-8.656,6.064-10.77,18.04-4.711,26.695 c3.583,5.115,9.457,8.169,15.714,8.169c0,0,0,0,0.001,0c3.94,0,7.735-1.197,10.976-3.467 c4.195-2.936,6.997-7.329,7.886-12.371c0.89-5.041-0.238-10.126-3.177-14.32C91.409,26.623,85.534,23.564,79.276,23.564z"/> </g>  </g>  </g>  </g>  <g>  <g>  <rect x="20.662" y="18.818" class="bg" width="17.643" height="5.915"/>  </g>  </g>  <g>  <g>  <rect x="20.662" y="61.626" class="bg" width="17.643" height="5.918"/>  </g>  </g>  <g>  <g>  <rect x="14.4" y="33.088" class="bg" width="23.904" height="5.916"/>  </g>  </g>  <g>  <g>  <rect y="47.356" class="bg" width="38.305" height="5.918"/>  </g>  </g>  </g></g></svg>'
        }
    };


    nx.each(topology_icon, function (icon, key) {
        ICONS.icons[key] = {
            icon: new DOMParser().parseFromString(icon.icon, "text/xml").documentElement.cloneNode(true),
            size: {width: icon.width, height: icon.height},
            name: key
        };
    });

})(nx, nx.util, nx.global);

(function (nx, util, global) {
    var NS = "http://www.w3.org/2000/svg";
    var xlink = 'http://www.w3.org/1999/xlink';


    /**
     * SVG group component
     * @class nx.graphic.Group
     * @extend nx.graphic.Component
     * @module nx.graphic
     */
    nx.define("nx.graphic.Group", nx.graphic.Component, {
        view: {
            tag: 'svg:g'
        }
    });
    /**
     * SVG rect component
     * @class nx.graphic.Rect
     * @extend nx.graphic.Component
     * @module nx.graphic
     */

    nx.define("nx.graphic.Rect", nx.graphic.Component, {
        view: {
            tag: 'svg:rect'
        }
    });

    /**
     * SVG circle component
     * @class nx.graphic.Circle
     * @extend nx.graphic.Component
     * @module nx.graphic
     */
    nx.define("nx.graphic.Circle", nx.graphic.Component, {
        view: {
            tag: 'svg:circle'

        }
    });

    /**
     * SVG text component
     * @class nx.graphic.Text
     * @extend nx.graphic.Component
     * @module nx.graphic
     */
    nx.define("nx.graphic.Text", nx.graphic.Component, {
        properties: {
            /**
             * Set/get text
             * @property text
             */
            text: {
                get: function () {
                    return this._text !== undefined ? this._text : 0;
                },
                set: function (value) {
                    if (this._text !== value) {
                        this._text = value;

                        if (this.resolve('@root') && value !== undefined) {
                            var el = this.resolve("@root").$dom;
                            if ((el.nodeName == "text" || el.nodeName == "#text")) {
                                if (el.firstChild) {
                                    el.removeChild(el.firstChild);
                                }
                                el.appendChild(document.createTextNode(value));
                            }
                        }
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        view: {
            tag: 'svg:text'
        }
    });

    /**
     * SVG image component
     * @class nx.graphic.Image
     * @extend nx.graphic.Component
     * @module nx.graphic
     */
    nx.define("nx.graphic.Image", nx.graphic.Component, {
        properties: {
            /**
             * Set/get image src
             * @property src
             */
            src: {
                get: function () {
                    return this._src !== undefined ? this._src : 0;
                },
                set: function (value) {
                    if (this._src !== value) {
                        this._src = value;
                        if (this.resolve('@root') && value !== undefined) {
                            var el = this.resolve("@root").$dom;
                            el.setAttributeNS(xlink, 'href', value);
                        }
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        view: {
            tag: 'svg:image'
        }
    });
    /**
     * SVG path component
     * @class nx.graphic.Path
     * @extend nx.graphic.Component
     * @module nx.graphic
     */

    nx.define("nx.graphic.Path", nx.graphic.Component, {
        view: {
            tag: 'svg:path'
        }
    });
    /**
     * SVG polygon component
     * @class nx.graphic.Polygon
     * @extend nx.graphic.Path
     * @module nx.graphic
     */

    nx.define("nx.graphic.Polygon", nx.graphic.Path, {
        properties: {
            nodes: {
                /**
                 * Set/get point array to generate a polygon shape
                 * @property nodes
                 */
                get: function () {
                    return this._nodes || [];
                },
                set: function (value) {
                    this._nodes = value;
                    var vertices = value;
                    if (vertices.length !== 0) {
                        if (vertices.length == 1) {
                            var point = vertices[0];
                            vertices.push({x: point.x - 1, y: point.y - 1});
                            vertices.push({x: point.x + 1, y: point.y - 1});
                        } else if (vertices.length == 2) {
                            vertices.push([vertices[0].x + 1, vertices[0].y + 1]);
                            vertices.push(vertices[1]);
                        }

                        var nodes = nx.data.Convex.process(vertices);
                        var path = [];
                        path.push('M ', nodes[0].x, ' ', nodes[0].y);
                        for (var i = 1; i < nodes.length; i++) {
                            if (!nx.is(nodes[i], 'Array')) {
                                path.push(' L ', nodes[i].x, ' ', nodes[i].y);
                            }

                        }
                        path.push(' Z');
                        this.set("d", path.join(''));
                    }

                }
            }
        }
    });

    nx.define("nx.graphic.Triangle", nx.graphic.Path, {
        properties: {
            width: {
                get: function () {
                    return this._width !== undefined ? this._width : 0;
                },
                set: function (value) {
                    if (this._width !== value) {
                        this._width = value;
                        this._draw();
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            height: {
                get: function () {
                    return this._height !== undefined ? this._height : 0;
                },
                set: function (value) {
                    if (this._height !== value) {
                        this._height = value;
                        this._draw();
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        methods: {
            _draw: function () {
                if (this._width && this._height) {
                    var path = [];
                    path.push('M ', this._width / 2, ' ', 0);
                    path.push(' L ', this._width, ' ', this._height);
                    path.push(' L ', 0, ' ', this._height);
                    path.push(' Z');
                    this.set("d", path.join(''));
                }


            }
        }
    });


    /**
     * SVG BezierCurves component
     * @class nx.graphic.BezierCurves
     * @extend nx.graphic.Path
     * @module nx.graphic
     */

    nx.define("nx.graphic.BezierCurves", nx.graphic.Path, {
        properties: {
            /**
             * set/get start point'x
             * @property x1
             */
            x1: {
                set: function (value) {
                    this._x1 = value;
                    this._buildPath();
                },
                get: function () {
                    return this._x1 || 0;
                }
            },
            /**
             * set/get start point'y
             * @property y1
             */
            y1: {
                set: function (value) {
                    this._y1 = value;
                    this._buildPath();
                },
                get: function () {
                    return this._y1 || 0;
                }
            },
            /**
             * set/get end point'x
             * @property x2
             */
            x2: {
                set: function (value) {
                    this._x2 = value;
                    this._buildPath();
                },
                get: function () {
                    return this._x2 || 0;
                }
            },
            /**
             * set/get end point'x
             * @property y2
             */
            y2: {
                set: function (value) {
                    this._y2 = value;
                    this._buildPath();
                },
                get: function () {
                    return this._y2 || 0;
                }
            },
            isClockwise: {
                value: true
            },
            straight: {
                value: false
            }
        },
        methods: {
            _buildPath: function () {
                var x1 = this.x1();
                var x2 = this.x2();
                var y1 = this.y1();
                var y2 = this.y2();

                var d;

                if (x1 !== null && x2 !== null && y1 !== null && y2 !== null) {
                    var dx = (x1 - x2);
                    var dy = (y2 - y1);
                    var dr = Math.sqrt((dx * dx + dy * dy));


                    if (this.straight()) {
                        d = "M" + x1 + "," + y1 + " " + x2 + "," + y2;
                    } else if (this.isClockwise()) {
                        d = "M" + x2 + "," + y2 +
                            "A " + dr + " " + dr + ", 0, 0, 1, " + x1 + "," + y1 +
                            "A " + (dr - 0) + " " + (dr - 0) + ", 0, 0, 0, " + x2 + "," + y2;
                    } else {
                        d = "M" + x2 + "," + y2 +
                            "A " + dr + " " + dr + ", 0, 0, 0, " + x1 + "," + y1 +
                            "A " + (dr - 0) + " " + (dr - 0) + ", 0, 0, 1, " + x2 + "," + y2;
                    }

                    return this.set("d", d);

                } else {
                    return null;
                }
            }
        }
    });

    /**
     * SVG line component
     * @class nx.graphic.Line
     * @extend nx.graphic.Component
     * @module nx.graphic
     */
    nx.define("nx.graphic.Line", nx.graphic.Component, {
        view: {
            tag: 'svg:line'
        }
    });

    /**
     * SVG icon component, which icon's define in nx framework
     * @class nx.graphic.Icon
     * @extend nx.graphic.Component
     * @module nx.graphic
     */
    nx.define("nx.graphic.Icon", nx.graphic.Component, {
        view: {
            tag: 'svg:use'
        },
        properties: {
            /**
             * set/get icon's type
             * @property iconType
             */
            iconType: {
                get: function () {
                    return this._iconType;
                },
                set: function (value) {
                    var icon = nx.graphic.Icons.get(value);
                    var size = icon.size;
                    this.size(size);
                    this._iconType = icon.name;

                    this.view().dom().$dom.setAttributeNS(xlink, 'xlink:href', '#' + value);
                }
            },
            /**
             * set/get icon size
             * @property size
             */
            size: {
                get: function () {
                    return this._size || {
                        width: 36,
                        height: 36
                    };
                },
                set: function (value) {
                    this._size = value;
                    this.setTransform(value.width / -2, value.height / -2);
                }
            }
        }
    });
    /**
     * SVG root component
     * @class nx.graphic.Stage
     * @extend nx.ui.Component
     * @module nx.graphic
     */
    nx.define("nx.graphic.Stage", nx.ui.Component, {
        events: ['dragStageStart', 'dragStage', 'dragStageEnd'],
        view: {
            tag: 'svg:svg',
            props: {
                'class': 'n-svg',
                version: '1.1',
                xmlns: "http://www.w3.org/2000/svg",
                'xmlns:xlink': 'http://www.w3.org/1999/xlink',
                style: {
                    width: '{#width}',
                    height: '{#height}'
                }
            },
            content: [
                {
                    name: 'defs',
                    tag: 'svg:defs'
                },
                {
                    name: 'bg',
                    type: 'nx.graphic.Rect',
                    props: {
                        visible: false,
                        fill: '#f00'
                    }
                },
                {
                    name: 'stage',
                    type: 'nx.graphic.Group',
                    props: {
                        'class': 'stage',
                        scale: '{#scale,direction=<>}',
                        translateX: '{#translateX,direction=<>}',
                        translateY: '{#translateY,direction=<>}'
                    }
                }
            ],
            events: {
                'mousedown': '{#_mousedown}',
                'dragstart': '{#_dragstart}',
                'dragmove': '{#_drag}',
                'dragend': '{#_dragend}'
            }
        },
        properties: {
            /**
             * set/get stage's width
             * @property width
             */
            width: {value: 0},
            /**
             * set/get stage's height
             * @property height
             */
            height: {value: 0},
            /**
             * set/get content's scale
             * @property scale
             */
            scale: {value: 1},
            /**
             * set/get content's x translate
             * @property translateX
             */
            translateX: {value: 0},
            /**
             * set/get content's y translate
             * @property translateY
             */
            translateY: {value: 0},
            /**
             * set/get content translate object
             * @property translate
             */
            translate: {
                get: function () {
                    return{
                        x: this._translateX,
                        y: this._translateY
                    };
                },
                set: function (value) {
                    if (value && value.x != null && value.y != null) {
                        this.setTransform(value.x, value.y);
                    }
                }
            },
            /**
             * get content group element
             * @property stage
             */
            stage: {
                get: function () {
                    return this.resolve("stage");
                }
            }
        },
        methods: {
            getContainer: function () {
                return this.resolve('stage').resolve("@root");
            },
            /**
             * Add svg def element into the stage
             * @method addDef
             * @param el {SVGDOM}
             */
            addDef: function (el) {
                this.resolve("defs").resolve("@root").$dom.appendChild(el);
            },
            /**
             * Add svg def element into the stage in string format
             * @method addDefString
             * @param str {String}
             */
            addDefString: function (str) {
                this.resolve("defs").resolve("@root").$dom.appendChild(new DOMParser().parseFromString(str, "text/xml").documentElement);
            },
            /**
             * Get content's relative bound
             * @method getContentBound
             * @returns {{left: number, top: number, width: Number, height: Number}}
             */
            getContentBound: function () {
                var stageBound = this.stage().getBound();
                var topoBound = this.view().dom().getBound();

                return {
                    left: stageBound.left - topoBound.left,
                    top: stageBound.top - topoBound.top,
                    width: stageBound.width,
                    height: stageBound.height
                };
            },
            /**
             * set/get content's transform
             * @method setTransform
             * @param [translateX] {Number} x axle translate
             * @param [translateY] {Number} y axle translate
             * @param [scale] {Number} element's scale
             * @param [duration=0] {Number} transition time, unite is second
             */
            setTransform: function (translateX, translateY, scale, duration) {

                var stage = this.stage();
                stage.setTransform(translateX, translateY, scale, duration);
                stage.notify('translateX');
                stage.notify('translateY');
                stage.notify('scale');
            },
            _mousedown: function (sender, event) {
                event.captureDrag(sender);
            },
            _dragstart: function (sender, event) {
                this.resolve("stage").resolve("@root").setStyle('pointer-events', 'none');
                this.fire('dragStageStart', event);
            },
            _drag: function (sender, event) {
                this.fire('dragStage', event);
            },
            _dragend: function (sender, event) {
                this.fire('dragStageEnd', event);
                this.resolve("stage").resolve("@root").setStyle('pointer-events', 'all');
            }
        }
    });

    /**
     * SVG topology svg component, add all icon's to svg's def.
     * @class nx.graphic.TopologyStage
     * @extend nx.graphic.Stage
     * @module nx.graphic
     */
    nx.define("nx.graphic.TopologyStage", nx.graphic.Stage, {
        events: [],
        methods: {
            init: function (args) {
                this.inherited(args);


                var linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
                linearGradient.setAttribute("id", "disable");
                linearGradient.setAttribute("x1", "0%");
                linearGradient.setAttribute("y1", "0%");
                linearGradient.setAttribute("x2", "100%");
                linearGradient.setAttribute("y2", "100%");


                var stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stop.setAttribute("offset", "0%");
                stop.setAttribute("style", "stop-color:rgb(255,255,0);stop-opacity:1");


                var stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stop2.setAttribute("offset", "100%");
                stop2.setAttribute("style", "stop-color:rgb(255,0,0);stop-opacity:1");


                linearGradient.appendChild(stop);
                linearGradient.appendChild(stop2);

                this.resolve("defs").resolve("@root").$dom.appendChild(linearGradient);


                nx.each(nx.graphic.Icons.icons, function (iconObj, key) {
                    if (iconObj.icon) {
                        var icon = iconObj.icon.cloneNode(true);
                        icon.setAttribute("height", iconObj.size.height);
                        icon.setAttribute("width", iconObj.size.width);
                        icon.setAttribute("data-device-type", key);
                        icon.setAttribute("id", key);
                        icon.setAttribute("class", 'deviceIcon');
                        this.addDef(icon);
                    }
                }, this);

            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx) {
    /**
     * Mathematics Vector class
     * @class nx.math.Vector
     * @module nx.math
     */

    /**
     * Vector constructor function
     * @param x {Number}
     * @param y {Number}
     * @constructor
     */
    function Vector(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    Vector.prototype = {
        constructor: Vector,
        /**
         * @method equals
         * @param v {nx.math.Vector}
         * @returns {boolean}
         */
        equals: function (v) {
            return this.x === v.x && this.y === v.y;
        },
        /**
         * @method length
         * @returns {number}
         */
        length: function () {
            return Math.sqrt(this.squaredLength());
        },
        /**
         * @method squaredLength
         * @returns {number}
         */
        squaredLength: function () {
            var x = this.x,
                y = this.y;

            return x * x + y * y;
        },
        /**
         * @method angle
         * @returns {number}
         */
        angle: function () {
            var l = this.length(),
                a = l && Math.acos(this.x / l);
            a = a * 180 / Math.PI;
            a = this.y > 0 ? a : -a;

            return a;
        },
        /**
         * @method circumferentialAngle
         * @returns {number}
         */
        circumferentialAngle: function () {
            var angle = this.angle();
            if (angle < 0) {
                angle += 360;
            }
            return angle;

        },
        /**
         * @method slope
         * @returns {number}
         */
        slope: function () {
            return this.y / this.x;
        },
        /**
         * @method add
         * @param v {nx.math.Vector}
         * @returns {nx.math.Vector}
         */
        add: function (v) {
            return new Vector(this.x + v.x, this.y + v.y);
        },
        /**
         * @method subtract
         * @param v {nx.math.Vector}
         * @returns {nx.math.Vector}
         */
        subtract: function (v) {
            return new Vector(this.x - v.x, this.y - v.y);
        },
        /**
         * @method multiply
         * @param k {Number}
         * @returns {nx.math.Vector}
         */
        multiply: function (k) {
            return new Vector(this.x * k, this.y * k);
        },
        /**
         * @method divide
         * @param k {Number}
         * @returns {nx.math.Vector}
         */
        divide: function (k) {
            return new Vector(this.x / k, this.y / k);
        },
        /**
         * @method rotate
         * @param a {Number}
         * @returns {nx.math.Vector}
         */
        rotate: function (a) {
            var x = this.x,
                y = this.y,
                sinA = Math.sin(a / 180 * Math.PI),
                cosA = Math.cos(a / 180 * Math.PI);

            return new Vector(x * cosA - y * sinA, x * sinA + y * cosA);
        },
        /**
         * @method negate
         * @returns {nx.math.Vector}
         */
        negate: function () {
            return new Vector(-this.x, -this.y);
        },
        /**
         * @method normal
         * @returns {nx.math.Vector}
         */
        normal: function () {
            var l = this.length() || 1;
            return new Vector(-this.y / l, this.x / l);
        },
        /**
         * @method normalize
         * @returns {nx.math.Vector}
         */
        normalize: function () {
            var l = this.length() || 1;
            return new Vector(this.x / l, this.y / l);
        },
        /**
         * @method clone
         * @returns {nx.math.Vector}
         */
        clone: function () {
            return new Vector(this.x, this.y);
        }
    };

    nx.math = {};
    nx.math.Vector = Vector;
})(nx);
(function (nx) {
    var Vector = nx.math.Vector;

    /**
     * Mathematics Line class
     * @class nx.math.Line
     * @module nx.math
     */

    /**
     * Line class constructor function
     * @param start {nx.math.Vector}
     * @param end {nx.math.Vector}
     * @constructor
     */
    function Line(start, end) {
        this.start = start || new Vector();
        this.end = end || new Vector();
        this.dir = this.end.subtract(this.start);
    }

    Line.prototype = {
        constructor: Line,
        /**
         * @method length
         * @returns {*}
         */
        length: function () {
            return this.dir.length();
        },
        /**
         * @method squaredLength
         * @returns {*}
         */
        squaredLength: function () {
            return this.dir.squaredLength();
        },
        /**
         * @method angle
         * @returns {*}
         */
        angle: function () {
            return this.dir.angle();
        },
        /**
         * @methid intersection
         * @returns {*}
         */
        circumferentialAngle: function () {
            var angle = this.angle();
            if (angle < 0) {
                angle += 360;
            }
            return angle;
        },
        /**
         * @method center
         * @returns {nx.math.Vector}
         */
        center: function () {
            return this.start.add(this.end).divide(2);
        },
        /**
         * @method slope
         * @returns {*}
         */
        slope: function () {
            return this.dir.slope();
        },
        /**
         * @method general
         * @returns {Array}
         */
        general: function () {
            var k = this.slope(),
                start = this.start;
            if (isFinite(k)) {
                return [k, -1, start.y - k * start.x];
            }
            else {
                return [1, 0, -start.x];
            }
        },
        /**
         * @method intersection
         * @param l {nx.math.Line}
         * @returns {nx.math.Vector}
         */
        intersection: function (l) {
            var g0 = this.general(),
                g1 = l.general();

            return new Vector(
                (g0[1] * g1[2] - g1[1] * g0[2]) / (g0[0] * g1[1] - g1[0] * g0[1]),
                (g0[0] * g1[2] - g1[0] * g0[2]) / (g1[0] * g0[1] - g0[0] * g1[1]));
        },
        /**
         * @method pedal
         * @param v {nx.math.Vector}
         * @returns {nx.math.Vector}
         */
        pedal: function (v) {
            var dir = this.dir,
                g0 = this.general(),
                g1 = [dir.x, dir.y, -v.x * dir.x - v.y * dir.y];

            return new Vector(
                (g0[1] * g1[2] - g1[1] * g0[2]) / (g0[0] * g1[1] - g1[0] * g0[1]),
                (g0[0] * g1[2] - g1[0] * g0[2]) / (g1[0] * g0[1] - g0[0] * g1[1]));
        },
        /**
         * @method translate
         * @param v {nx.math.Vector}
         * @returns {mx.math.Line}
         */
        translate: function (v) {
            v = v.rotate(this.angle());
            return new Line(this.start.add(v), this.end.add(v));
        },
        /**
         * @method rotate
         * @param a {Number}
         * @returns {nx.math.Line}
         */
        rotate: function (a) {
            return new Line(this.start.rotate(a), this.end.rotate(a));
        },
        /**
         * @method negate
         * @returns {nx.math.Line}
         */
        negate: function () {
            return new Line(this.end, this.start);
        },
        /**
         * @method normal
         * @returns {nx.math.Vector}
         */
        normal: function () {
            var dir = this.dir, l = this.dir.length();
            return new Vector(-dir.y / l, dir.x / l);
        },
        /**
         * @method pad
         * @param a {nx.math.Vector}
         * @param b {nx.math.Vector}
         * @returns {nx.math.Line}
         */
        pad: function (a, b) {
            var n = this.dir.normalize();
            return new Line(this.start.add(n.multiply(a)), this.end.add(n.multiply(-b)));
        },
        /**
         * @method clone
         * @returns {nx.math.Line}
         */
        clone: function () {
            return new Line(this.start, this.end);
        }
    };

    nx.math.Line = Line;
})(nx);
(function (nx, util, global) {


    /*
     0|1
     ---
     2|3
     */

    nx.data.QuadTree = function (inPoints, inWidth, inHeight, inCharge) {
        var width = inWidth || 800;
        var height = inHeight || 600;
        var charge = inCharge || 200;
        var points = inPoints;
        var x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        this.root = null;
        this.alpha = 0;

        if (points) {
            var i = 0, length = points.length;
            var point, px, py;
            for (; i < length; i++) {
                point = points[i];
                point.dx = 0;
                point.dy = 0;
                px = point.x;
                py = point.y;
                if (isNaN(px)) {
                    px = point.x = Math.random() * width;
                }
                if (isNaN(py)) {
                    py = point.y = Math.random() * height;
                }
                if (px < x1) {
                    x1 = px;
                } else if (px > x2) {
                    x2 = px;
                }
                if (py < y1) {
                    y1 = py;
                } else if (py > y2) {
                    y2 = py;
                }
            }

            //square
            var dx = x2 - x1, dy = y2 - y1;
            if (dx > dy) {
                y2 = y1 + dx;
            } else {
                x2 = x1 + dy;
            }

            var root = this.root = new QuadTreeNode(this, x1, y1, x2, y2);
            for (i = 0; i < length; i++) {
                root.insert(points[i]);
            }
        }
    };

    var QuadTreeNode = function (inQuadTree, inX1, inY1, inX2, inY2) {
        var x1 = this.x1 = inX1, y1 = this.y1 = inY1, x2 = this.x2 = inX2, y2 = this.y2 = inY2;
        var cx = (x1 + x2) * 0.5, cy = (y1 + y2) * 0.5;
        var dx = (inX2 - inX1) * 0.5;
        var dy = (inY2 - inY1) * 0.5;
        this.point = null;
        this.nodes = null;
        this.insert = function (inPoint) {
            var point = this.point;
            var nodes = this.nodes;
            if (!point && !nodes) {
                this.point = inPoint;
                return;
            }
            if (point) {
                if (Math.abs(point.x - inPoint.x) + Math.abs(point.y - inPoint.y) < 0.01) {
                    this._insert(inPoint);
                } else {
                    this.point = null;
                    this._insert(point);
                    this._insert(inPoint);
                }
            } else {
                this._insert(inPoint);
            }
        };

        this._insert = function (inPoint) {
            var right = inPoint.x >= cx, bottom = inPoint.y >= cy, i = (bottom << 1) + right;
            var index = (bottom << 1) + right;
            var x = x1 + dx * right;
            var y = y1 + dy * bottom;
            var nodes = this.nodes || (this.nodes = []);
            var node = nodes[index] || (nodes[index] = new QuadTreeNode(inQuadTree, x, y, x + dx, y + dy));
            node.insert(inPoint);
        };
    };

})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * NeXt force layout algorithm class
     * @class nx.data.Force
     */

    /**
     * Force layout algorithm class constructor function
     * @param inWidth {Number} force stage width, default 800
     * @param inHeight {Number} force stage height, default 800
     * @constructor
     */

    nx.data.Force = function (inWidth, inHeight) {
        var width = inWidth || 800;
        var height = inHeight || 800;
        var strength = 4;
        var distance = 100;
        var gravity = 0.01;
        this.charge = 1200;
        this.alpha = 1;

        this.totalEnergy = Infinity;
        this.maxEnergy = Infinity;

        var threshold = 2;
        var theta = 0.8;
        this.nodes = null;
        this.links = null;
        this.quadTree = null;
        /**
         * Set data to this algorithm
         * @method setData
         * @param inJson {Object} Follow Common Topology Data Definition
         */
        this.setData = function (inJson) {
            var nodes = this.nodes = inJson.nodes;
            var links = this.links = inJson.links;
            var nodeMap = this.nodeMap = {};
            var weightMap = this.weightMap = {};
            var node, link, i = 0, length = nodes.length, id;
            for (; i < length; i++) {
                node = nodes[i];
                id = node.id || i;
                nodeMap[id] = node;
                weightMap[id] = 0;
            }
            if (links) {
                length = links.length;
                for (i = 0; i < length; ++i) {
                    link = links[i];
                    id = link.source;
                    ++weightMap[id];
                    id = link.target;
                    ++weightMap[id];
                }
            }
        };
        /**
         * Start processing
         * @method start
         */
        this.start = function () {
            var totalEnergyThreshold = threshold * this.nodes.length;
            while (true) {
                this.tick();
                if (this.maxEnergy < threshold * 5 && this.totalEnergy < totalEnergyThreshold) {
                    break;
                }
            }
        };
        /**
         * Tick whole force stage
         * @method tick
         */
        this.tick = function () {
            var nodes = this.nodes;
            var quadTree = this.quadTree = new nx.data.QuadTree(nodes, width, height);
            this._calculateLinkEffect();
            this._calculateCenterGravitation();

            var root = quadTree.root;
            this._calculateQuadTreeCharge(root);
//            var chargeCallback = this.chargeCallback;
//            if (chargeCallback) {
//                chargeCallback.call(scope, root);
//            }
            var i, length = nodes.length, node;
            for (i = 0; i < length; i++) {
                node = nodes[i];
                this._calculateChargeEffect(root, node);
            }
            this._changePosition();
        };
        this._changePosition = function () {
            var totalEnergy = 0;
            var maxEnergy = 0;
            var nodes = this.nodes;
            var i, node, length = nodes.length, x1 = 0, y1 = 0, x2 = 0, y2 = 0, x, y, energy, dx, dy;
            for (i = 0; i < length; i++) {
                node = nodes[i];
                dx = node.dx * 0.5;
                dy = node.dy * 0.5;
                energy = Math.abs(dx) + Math.abs(dy);

                if (!node.fixed) {

                    totalEnergy += energy;

                    if (energy > maxEnergy) {
                        maxEnergy = energy;
                    }
                }


                if (!node.fixed) {
                    x = node.x += dx;
                    y = node.y += dy;
                }
                if (x < x1) {
                    x1 = x;
                } else if (x > x2) {
                    x2 = x;
                }
                if (y < y1) {
                    y1 = y;
                } else if (y > y2) {
                    y2 = y;
                }
            }
            this.totalEnergy = totalEnergy;
            this.maxEnergy = maxEnergy;
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        };
        this._calculateCenterGravitation = function () {
            var nodes = this.nodes;
            var node, x, y;
            var length = nodes.length;

            var k = 0.5 * gravity;
            x = width / 2;
            y = height / 2;
            for (var i = 0; i < length; i++) {
                node = nodes[i];
                node.dx += (x - node.x) * k;
                node.dy += (y - node.y) * k;
            }
        };
        this._calculateLinkEffect = function () {
            var links = this.links;
            var nodeMap = this.nodeMap;
            var weightMap = this.weightMap;
            var i, length , link, source, target, dx, dy, d2, d, dk, k, sWeight, tWeight, totalWeight;
            if (links) {
                length = links.length;
                for (i = 0; i < length; ++i) {
                    link = links[i];
                    source = nodeMap[link.source];
                    target = nodeMap[link.target];
                    dx = target.x - source.x;
                    dy = target.y - source.y;
                    if (dx === 0 && dy === 0) {
                        target.x += Math.random() * 5;
                        target.y += Math.random() * 5;
                        dx = target.x - source.x;
                        dy = target.y - source.y;
                    }
                    d2 = dx * dx + dy * dy;
                    d = Math.sqrt(d2);
                    if (d2) {
                        dk = strength * (d - distance) / d;
                        dx *= dk;
                        dy *= dk;
                        sWeight = weightMap[source.id];
                        tWeight = weightMap[target.id];
                        totalWeight = sWeight + tWeight;
                        k = sWeight / totalWeight;
                        target.dx -= (dx * k) / totalWeight;
                        target.dy -= (dy * k) / totalWeight;
                        k = 1 - k;
                        source.dx += (dx * k) / totalWeight;
                        source.dy += (dy * k) / totalWeight;
                    }
                }
            }
        };
        this._calculateQuadTreeCharge = function (inNode) {
            if (inNode.fixed) {
                return;
            }
            var nodes = inNode.nodes;
            var point = inNode.point;
            var chargeX = 0, chargeY = 0, charge = 0;
            if (!nodes) {
                inNode.charge = inNode.pointCharge = this.charge;
                inNode.chargeX = point.x;
                inNode.chargeY = point.y;
                return;
            }
            if (nodes) {
                var i = 0, length = nodes.length, node, nodeCharge;
                for (; i < length; i++) {
                    node = nodes[i];
                    if (node) {
                        this._calculateQuadTreeCharge(node);
                        nodeCharge = node.charge;
                        charge += nodeCharge;
                        chargeX += nodeCharge * node.chargeX;
                        chargeY += nodeCharge * node.chargeY;
                    }
                }
            }
            if (point) {
                var thisCharge = this.charge;
                charge += thisCharge;
                chargeX += thisCharge * point.x;
                chargeY += thisCharge * point.y;
            }
            inNode.charge = charge;
            inNode.chargeX = chargeX / charge;
            inNode.chargeY = chargeY / charge;
        };
        this._calculateChargeEffect = function (inNode, inPoint) {
            if (this.__calculateChargeEffect(inNode, inPoint)) {
                var nodes = inNode.nodes;
                if (nodes) {
                    var node, i = 0, length = nodes.length;
                    for (; i < length; i++) {
                        node = nodes[i];
                        if (node) {
                            this._calculateChargeEffect(node, inPoint);
                        }
                    }
                }

            }
        };

        this.__calculateChargeEffect = function (inNode, inPoint) {
            if (inNode.point != inPoint) {
                var dx = inNode.chargeX - inPoint.x;
                var dy = inNode.chargeY - inPoint.y;
                var d2 = dx * dx + dy * dy;
                var d = Math.sqrt(d2);
                var dk = 1 / d;
                var k;
                if ((inNode.x2 - inNode.x1) * dk < theta) {
                    k = inNode.charge * dk * dk;
                    inPoint.dx -= dx * k;
                    inPoint.dy -= dy * k;
                    return false;
                } else {
                    if (inNode.point) {
                        if (!isFinite(dk)) {
                            inPoint.dx -= Math.random() * 10;
                            inPoint.dy -= Math.random() * 10;
                        } else {
                            k = inNode.pointCharge * dk * dk;
                            inPoint.dx -= dx * k;
                            inPoint.dy -= dy * k;
                        }
                    }
                }
            }
            return true;
        };
    };
})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Convex algorithm
     * @class nx.data.Convex
     * @static
     */
    nx.define('nx.data.Convex', {
        static: true,
        methods: {
            multiply: function (p1, p2, p0) {
                return((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y));
            },
            dis: function (p1, p2) {
                return(Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)));
            },
            /**
             * Process given node array
             * @method process
             * @param inPointArray {Array} Each item should be a object, which include x&y attribute
             * @returns {Array}
             */
            process: function (inPointArray) {
                var stack = [];
                var count = inPointArray.length;
                var i, j, k = 0, top = 2;
                var tmp;

                //找到最下且偏左的那个点
                for (i = 1; i < count; i++) {
                    if ((inPointArray[i].y < inPointArray[k].y) || ((inPointArray[i].y === inPointArray[k].y) && (inPointArray[i].x < inPointArray[k].x))) {
                        k = i;
                    }
                }
                //将这个点指定为PointSet[0]
                tmp = inPointArray[0];
                inPointArray[0] = inPointArray[k];
                inPointArray[k] = tmp;

                //按极角从小到大,距离偏短进行排序
                for (i = 1; i < count - 1; i++) {
                    k = i;
                    for (j = i + 1; j < count; j++)
                        if ((this.multiply(inPointArray[j], inPointArray[k], inPointArray[0]) > 0) ||
                            ((this.multiply(inPointArray[j], inPointArray[k], inPointArray[0]) === 0) &&
                                (this.dis(inPointArray[0], inPointArray[j]) < this.dis(inPointArray[0], inPointArray[k]))))
                            k = j;//k保存极角最小的那个点,或者相同距离原点最近
                    tmp = inPointArray[i];
                    inPointArray[i] = inPointArray[k];
                    inPointArray[k] = tmp;
                }
                //第三个点先入栈
                stack[0] = inPointArray[0];
                stack[1] = inPointArray[1];
                stack[2] = inPointArray[2];
                //判断与其余所有点的关系
                for (i = 3; i < count; i++) {
                    //不满足向左转的关系,栈顶元素出栈
                    while (top > 0 && this.multiply(inPointArray[i], stack[top], stack[top - 1]) >= 0) {
                        top--;
                        stack.pop();
                    }
                    //当前点与栈内所有点满足向左关系,因此入栈.
                    stack[++top] = inPointArray[i];
                }
                return stack;
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Vertex class
     * @class nx.data.Vertex
     * @extend nx.data.ObservableObject
     * @module nx.data
     */

    var Vector = nx.math.Vector;
    nx.define('nx.data.Vertex', nx.data.ObservableObject, {
        events: ['updateCoordinate'],
        properties: {
            /**
             * Vertex id
             * @property id {String|Number}
             */
            id: {},
            /**
             * Get x coordination mutator function
             * @property getXPath {Function}
             */
            getXPath: {
                value: function () {
                    return function () {
                        return this._data && this._data.x;
                    };
                }
            },
            /**
             * Set x coordination mutator function
             * @property setXPath {Function}
             */
            setXPath: {
                value: function () {
                    return function (value) {
                        this._data.x = value;
                    };
                }
            },
            /**
             * Get y coordination mutator function
             * @property getYPath {Function}
             */
            getYPath: {
                value: function () {
                    return function () {
                        return this._data && this._data.y;
                    };
                }
            },
            /**
             * Set y coordination mutator function
             * @property setYPath {Function}
             */
            setYPath: {
                value: function () {
                    return function (value) {
                        this._data.y = value;
                    };
                }
            },
            /**
             * Set to auto save x/y data to original data
             * @property ausoSave
             */
            autoSave: {
                value: true
            },
            /**
             * Get/set x coordination, suggest use position property
             * @property x
             */
            x: {
                get: function () {
                    return this._x || 0;
                },
                set: function (value) {
                    this.position({x: value});
                }
            },
            /**
             * Get/set y coordination, suggest use position property
             * @property y
             */
            y: {
                get: function () {
                    return this._y || 0;
                },
                set: function (value) {
                    this.position({y: value});
                }
            },
            /**
             * Get/set vertex position.
             * @property position
             */
            position: {
                get: function () {
                    return{
                        x: this._x || 0,
                        y: this._y || 0
                    };
                },
                set: function (obj) {
                    var isModified = false;
                    if (obj.x !== undefined && this._x !== obj.x) {
                        this._x = obj.x;
                        isModified = true;
                    }

                    if (obj.y !== undefined && this._y !== obj.y) {
                        this._y = obj.y;
                        isModified = true;
                    }
                    if (this.autoSave()) {
                        this.save();
                    }

                    if (isModified) {
                        this.fire("updateCoordinate", this.position());
                        this.notify("vector");
                    }
                }
            },
            /**
             * Get vertex's Vector object
             * @readOnly
             */
            vector: {
                get: function () {
                    var position = this.position();
                    return new Vector(position.x, position.y);
                }
            },
            /**
             * Is vertex virtual
             * @property virtual
             * @default false
             */
            virtual: {
                value: false
            },
            /**
             * Set/get vertex's visibility, and this property related to all connect edge set
             * @property visible {Boolean}
             * @default true
             */
            visible: {
                get: function () {
                    return this._visible !== undefined ? this._visible : true;
                },
                set: function (value) {
                    this._visible = value;
                    this.eachEdgeSet(function (edgeSet) {
                        edgeSet.visible(value);
                    });
                }
            },
            /**
             * Status property,tag is this vertex generated
             * @property generated {Boolean}
             * @default false
             */
            generated: {
                value: false
            },
            /**
             * Status property,tag is this vertex updated
             * @property updated {Boolean}
             * @default false
             */
            updated: {
                value: false
            },
            /**
             * Vertex's type
             * @property type {String}
             * @default 'vertex'
             */
            type: {
                value: 'vertex'
            },
            /**
             * Vertex parent vertex set, if exist
             * @property parentVertexSet {nx.data.VertexSet}
             */
            parentVertexSet: {},
            /**
             * Graph instance
             * @property graph {nx.data.ObservableGraph}
             */
            graph: {

            }
        },
        methods: {
            init: function (args) {
                this.inherited(args);
                this.edges = [];
                this.reverseEdges = [];
            },

            setPosition: function () {
                this.position({
                    x: this.getXPath().call(this),
                    y: this.getYPath().call(this)
                });
            },
            /**
             * Add connected edge, which source vertex is this vertex
             * @method addEdge
             * @param edge {nx.data.Edge}
             */
            addEdge: function (edge) {

                edge.visible(this.visible());

                this.edges.push(edge);

                this.reverseEdges = util.without(this.reverseEdges, edge);

            },
            /**
             * Get original data
             * @method getData
             * @returns {Object}
             */
            getData: function () {
                return this._data;
            },
            /**
             * Add connected edge, which target vertex is this vertex
             * @method addReverseEdge
             * @param edge {nx.data.Edge}
             */
            addReverseEdge: function (edge) {
                var index = this.edges.indexOf(edge);
                if (index == -1) {
                    this.reverseEdges.push(edge);
                }
            },
            /**
             * Remove edge from connected edges array
             * @method removeEdge
             * @param edge {nx.data.Edge}
             */
            removeEdge: function (edge) {
                this.edges = util.without(this.edges, edge);
                this.reverseEdges = util.without(this.reverseEdges, edge);
            },
            /**
             * Iterate all connected edges
             * @method eachEdge
             * @param callback {Function}
             * @param context {Object}
             */
            eachEdge: function (callback, context) {
                nx.each(this.edges.concat(this.reverseEdges), callback, context || this);
            },
            /**
             * Iterate all connected edges, which source vertex is this vertex
             * @method eachDirectedEdge
             * @param callback {Function}
             * @param context {Object}
             */
            eachDirectedEdge: function (callback, context) {
                nx.each(this.edges, function (edge) {
                    callback.call(context || this, edge);
                }, this);
            },
            /**
             * Iterate all connected edges, which source vertex is this vertex
             * @method eachReverseEdge
             * @param callback {Function}
             * @param context {Object}
             */
            eachReverseEdge: function (callback, context) {
                nx.each(this.reverseEdges, function (edge) {
                    callback.call(context || this, edge);
                }, this);
            },
            /**
             * Iterate all connected vertices
             * @method eachConnectedVertices
             * @param callback {Function}
             * @param context {Object}
             */
            eachConnectedVertices: function (callback, context) {
                var vertices = this.getConnectedVertices();

                nx.each(vertices, function (vertex) {
                    callback.call(context || this, vertex);
                }, this);
            },
            /**
             * Get all connected vertices
             * @method getConnectedVertices
             * @returns {*|Array}
             */
            getConnectedVertices: function () {
                var vertices = [];
                this.eachDirectedEdge(function (edge) {
                    if (edge.target().visible() && edge.target().generated()) {
                        vertices.push(edge.target());
                    }
                }, this);
                this.eachReverseEdge(function (edge) {
                    if (edge.source().visible() && edge.source().generated()) {
                        vertices.push(edge.source());
                    }
                }, this);

                return util.uniq(vertices);
            },
            /**
             * Iterate all connected edgeSet
             * @method eachConnectedVertices
             * @param callback {Function}
             * @param context {Object}
             */
            eachConnectedEdgeSet: function (callback, context) {
                var edgeSet = this.getConnectedEdgeSet();
                nx.each(edgeSet, callback, context || this);
            },
            /**
             * Get all connected edgeSet
             * @method getConnectedEdgeSet
             * @returns {*|Array}
             */
            getConnectedEdgeSet: function () {
                var edgeSetMap = {};
                nx.each(this.edges.concat(this.reverseEdges), function (edge) {
                    var edgeSet = edge.parentEdgeSet();
                    if (edgeSet.visible()) {
                        edgeSetMap[edgeSet.linkKey()] = edgeSet;
                    }
                }, this);
                return edgeSetMap;
            },


            /**
             * Iterate all connexted edgeSet
             * @param fn {Function}
             * @param context {Object}
             */
            eachEdgeSet: function (fn, context) {
                nx.each(this.getConnectedEdgeSet(), fn, context || this);
            },
            /**
             *Get root vertex set
             * @method getRootVertexSet
             * @returns {*}
             */
            getRootVertexSet: function () {
                var parentVertexSet = this.parentVertexSet();

                while (parentVertexSet && parentVertexSet.parentVertexSet()) {
                    parentVertexSet = parentVertexSet.parentVertexSet();
                }

                return parentVertexSet;
            },
            /**
             * Save x&y to original data
             * @method save
             */
            save: function () {
                this.setXPath().call(this, this.x());
                this.setYPath().call(this, this.y());
            },
            /**
             * Reset x&y
             * @method reset
             */
            reset: function () {
                this._x = null;
                this._y = null;
            }
        }
    });


})(nx, nx.util, nx.global);

(function (nx, util, global) {

    "use strict";
    /**
     * Edge
     * @class nx.data.Edge
     * @extend nx.data.ObservableObject
     * @module nx.data
     */

    var Line = nx.math.Line;
    nx.define('nx.data.Edge', nx.data.ObservableObject, {
        properties: {
            /**
             * Source vertex
             * @property source {nx.data.Vertex}
             */
            source: {
                value: null
            },
            /**
             * Target vertex
             * @property target {nx.data.Vertex}
             */
            target: {
                value: null
            },
            /**
             * Source vertex id
             * @property sourceID {String|Number}
             */
            sourceID: {
                value: null
            },
            /**
             * Target vertex id
             * @property targetID {String|Number}
             */
            targetID: {
                value: null
            },
            /**
             * Is edge is a virtual edge
             * @property virtual {Boolean}
             * @default false
             */
            virtual: {
                value: false
            },
            /**
             * Set/get edge's visibility
             * @property visible {Boolean}
             * @default true
             */
            visible: {
                get: function () {
                    return this._visible !== undefined ? this._visible : true;
                },
                set: function (value) {
                    if (this._visible !== undefined && this._visible !== value) {
                        this.updated(true);
                    }
                    this._visible = value;
                }
            },
            /**
             * Edge's linkkey, linkkey = sourceID-targetID
             * @property linkKey {String}
             */
            linkKey: {

            },
            /**
             * Edge's reverse linkkey,reverseLinkKey = targetID + '_' + sourceID
             * @property reverseLinkKey {String}
             */
            reverseLinkKey: {

            },

            /**
             * Status property,tag is this edge generated
             * @property generated {Boolean}
             * @default false
             */
            generated: {
                value: false
            },
            /**
             * Status property,tag is this edge updated
             * @property updated {Boolean}
             * @default false
             */
            updated: {
                value: false
            },
            /**
             * Edge's type
             * @property type {String}
             * @default edge
             */
            type: {
                value: 'edge'
            },
            /**
             * Edge's id
             * @property id {String|Number}
             */
            id: {},
            /**
             * Edge's parent edge set
             * @property parentEdgeSet {nx.data.edgeSet}
             */
            parentEdgeSet: {},
            /**
             * Edge line object
             * @property line {nx.math.Line}
             * @readOnly
             */
            line: {
                get: function () {
                    return new Line(this.source().vector(), this.target().vector());
                }
            },
            /**
             * Edge position object
             * {{x1: (Number), y1: (Number), x2: (Number), y2: (Number)}}
             * @property position {Object}
             * @readOnly
             */
            position: {
                get: function () {
                    return {
                        x1: this.source().get("x"),
                        y1: this.source().get("y"),
                        x2: this.target().get("x"),
                        y2: this.target().get("y")
                    };
                }
            },
            /**
             * Is this link is a reverse link
             * @property reverse {Boolean}
             * @readOnly
             */
            reverse: {
                value: false
            },
            /**
             * Graph instance
             * @property graph {nx.data.ObservableGraph}
             */
            graph: {

            }
        },
        methods: {
            /**
             * Get original data
             * @method getData
             * @returns {Object}
             */
            getData: function () {
                return this._data;
            },
            getRootEdgeSet: function () {
                var parent = this.parentEdgeSet();
                while (parent.parentEdgeSet()) {
                    parent = parent.parentEdgeSet();
                }
                return parent;
            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Vertex set ckass
     * @class nx.data.VertexSet
     * @extend nx.data.Vertex
     * @module nx.data
     */
    nx.define('nx.data.VertexSet', nx.data.Vertex, {
        properties: {
            /**
             * All child vertices
             * @property vertices {Array}
             * @default []
             */
            vertices: {
                value: function () {
                    return [];
                }
            },
            /**
             * VertexSet's type
             * @property type {String}
             * @default 'vertexset'
             */
            type: {
                value: 'vertexSet'
            },
            visible: {
                get: function () {
                    return this._visible !== undefined ? this._visible : true;
                },
                set: function (visible) {

                    nx.each(this.vertices(), function (edge) {
                        edge.visible(visible);
                    });


                    if (this._visible !== undefined || this._visible !== visible) {
                        this.updated(true);
                    }

                    this._visible = visible;

                }
            },
            activated: {
                get: function () {
                    return this._activated !== undefined ? this._activated : null;
                },
                set: function (value) {
                    if (this._activated !== value) {
                        this._activated = value;
                        var graph = this.graph();


                        nx.each(this.vertices(), function (vertex) {
                            vertex.visible(!value);
                            if (value) {
                                if (vertex.generated()) {
                                    vertex.generated(false);
                                    if (vertex.type() == 'vertex') {
                                        graph.fire('removeVertex', vertex);
                                    } else {
                                        graph.fire('removeVertexSet', vertex);
                                    }
                                }
                            } else {
                                if (!vertex.generated()) {
                                    vertex.generated(true);
                                    if (vertex.type() == 'vertex') {
                                        graph.fire('addVertex', vertex);
                                    } else {
                                        graph.fire('addVertexSet', vertex);
                                    }
                                }
                            }
                        }, this);


                        nx.each(this.edges.concat(this.reverseEdges), function (edge) {
                            var edgeset = edge.parentEdgeSet();
                            edgeset.visible(value);
                            if (value) {
                                if (!edgeset.generated()) {
                                    edgeset.generated(true);
                                    graph.fire('addEdgeSet', edgeset);
                                }

                            } else {
                                edgeset.generated(false);
                                graph.fire('removeEdgeSet', edgeset);
                                edgeset._activated = null;
                            }
                        }, this);


                        nx.each(this.edgeSetMap(), function (edgeset) {
                            edgeset.visible(!value);
                            if (value) {
                                edgeset.generated(false);
                                graph.fire('removeEdgeSet', edgeset);
                                edgeset._activated = null;
                            } else {
                                if (!edgeset.generated()) {
                                    edgeset.generated(true);
                                    graph.fire('addEdgeSet', edgeset);
                                }
                                edgeset.visible(true);
                            }
                        }, this);
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            edgeSetMap: {
                value: function () {
                    return {};
                }
            }
        },
        methods: {
            /***
             * Add child vertex
             * @method addVertex
             * @param vertex {nx.data.Vertex}
             */
            addVertex: function (vertex) {
                return this.vertices().push(vertex);
            },
            /**
             * Remove vertex
             * @param vertex {nx.data.Vertex}
             * @returns {Array}
             */
            removeVertex: function (vertex) {
                return this.vertices(util.without(this.vertices(), vertex));
            },
            addEdgeSet: function (obj) {
                var edgeSetMap = this.edgeSetMap();
                nx.each(obj, function (edgeSet, linkKey) {
                    edgeSetMap[linkKey] = edgeSet;
                }, this);
            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {
    'use strict';

    /**
     * Edge set clas
     * @class nx.data.EdgeSet
     * @extend nx.data.Edge
     * @module nx.data
     */

    nx.define('nx.data.EdgeSet', nx.data.Edge, {
        properties: {
            /**
             * All child edges
             * @property edges {Array}
             */
            edges: {
                value: function () {
                    return [];
                }
            },
            /**
             * All virtual child edges
             * @property virtualEdges {Array}
             */
            virtualEdges: {
                value: function () {
                    return [];
                }
            },
            /**
             * Edge's type
             * @property type {String}
             * @default 'edgeSet'
             */
            type: {
                value: 'edgeSet'
            },
            /**
             * Set/get edge set's visibility
             * @property visible {Boolean}
             * @default true
             */
            visible: {
                get: function () {
                    return this._visible !== undefined ? this._visible : true;
                },
                set: function (value) {
                    if (this._visible !== value) {
                        this._visible = value;

                        var visible;

                        if (value && (this.source().visible() && this.target().visible())) {
                            visible = true;
                        } else {
                            visible = false;
                        }


                        nx.each(this.edges(), function (edge) {
                            edge.visible(visible);
                        });


                        if (this._visible !== undefined || this._visible !== value) {
                            this.updated(true);
                        }

                        this._visible = visible;

                        return true;
                    } else {
                        return false;
                    }
                }
            },
            activated: {
                get: function () {
                    return this._activated;
                },
                set: function (value) {
                    var graph = this.graph();
                    nx.each(this.edges(), function (edge) {
                        edge.visible(!value);
                        if (edge.type() == 'edge') {
                            if (value) {
                                graph.fire('removeEdge', edge);
                            } else {
                                graph.fire('addEdge', edge);
                            }
                        } else if (edge.type() == 'edgeSet') {
                            if (value) {
                                graph.fire('removeEdgeSet', edge);
                            } else {
                                graph.fire('addEdgeSet', edge);
                            }
                        }
                    });
                    this._activated = value;
                }
            }
        },
        methods: {
            /**
             * Add child edge
             * @method addEdge
             * @param edge {nx.data.Edge}
             * @returns {Boolean}
             */
            addEdge: function (edge) {
                return this.edges().push(edge);
            },
            /**
             * Add child edges
             * @method addEdges
             * @param edges {Array}
             * @returns {Array}
             */
            addEdges: function (edges) {
                return this.edges(this.edges().concat(edges));
            },
            /**
             * Add virtual edges
             * @method addVirtualEdges
             * @param edges {Array}
             * @returns {Array}
             */
            addVirtualEdges: function (edges) {
                return this.virtualEdges(this.virtualEdges().concat(edges));
            },
            /**
             * Remove child edge
             * @method removeEdge
             * @param edge {nx.data.Edge}
             */
            removeEdge: function (edge) {
                var edges = this.edges();
                edges.splice(edges.indexOf(edge), 1);
            },
            /**
             * Iterate each edges, include virtual edges
             * @method eachEdges
             * @param callback {Function}
             * @param context {Object}
             */
            eachEdges: function (callback, context) {
                nx.each(this.edges().concat(this.virtualEdges()), callback, context || this);
            },
            /**
             * Get every child edges, include all child level
             * @method getEdges
             * @param isVisible {Boolean} is include visible edges,default false.
             * @param isNotVirtual {Boolean} is not include virtual edges,default false.
             * @returns {Array}
             */
            getEdges: function (isVisible, isNotVirtual) {
                var edges = [];
                nx.each(this.edges().concat(this.virtualEdges()), function (edge) {

                    if (edge instanceof nx.data.EdgeSet) {
                        edges = edges.concat(edge.getEdges(isVisible, isNotVirtual));
                    } else {

                        if (isNotVirtual === true && isVisible === true) {
                            if (edge.visible() && !edge.virtual()) {
                                edges.push(edge);
                            }
                        } else if (isNotVirtual === true) {
                            if (!edge.virtual()) {
                                edges.push(edge);
                            }
                        } else if (isVisible === true) {
                            if (edge.visible()) {
                                edges.push(edge);
                            }
                        } else {
                            edges.push(edge);
                        }
                    }
                });
                return edges;
            },
            getRootEdgeSet: function () {
                var parent = this.parentEdgeSet();
                while (parent) {
                    parent = parent.parentEdgeSet();
                }
                return parent;
            },
            /**
             * Detect is this edge set include sub edge set
             * @method containEdgeSet
             * @returns {boolean}
             */
            containEdgeSet: function () {
                var edgeSet = util.find(this.edges().concat(this.virtualEdges()), function (edge) {
                    return edge instanceof nx.data.EdgeSet;
                });

                return edgeSet !== undefined;

            },
            removeAllEdges: function () {
                var graph = this.graph();
                nx.each(this.edges(), function (edge) {
                    edge.generated(false);
                    if (edge.type() == 'edge') {
                        graph.fire('removeEdge', edge);
                    } else if (edge.type() == 'edgeSet') {
                        graph.fire('removeEdgeSet', edge);
                    }
                });
            }
        }

    });
})(nx, nx.util, nx.global);
(function (nx, util, global, logger) {
    /**
     * Force layout processor
     * @class nx.data.ObservableGraph.ForceProcessor
     * @module nx.data
     */
    nx.define("nx.data.ObservableGraph.ForceProcessor", {
        methods: {
            /**
             * Process graph data
             * @param data {JSON} standard graph data
             * @param [key]
             * @param [model]
             * @returns {JSON} {JSON} standard graph data
             */
            process: function (data, key, model) {
                var forceStartDate = new Date();

                var _data = {nodes: data.nodes, links: []};
                var nodeIndexMap = {};
                nx.each(data.nodes, function (node, index) {
                    nodeIndexMap[node[key]] = index;
                });


                // if source and target is not number, force will search node
                nx.each(data.links, function (link) {
                    if (!nx.is(link.source, 'Object') && nodeIndexMap[link.source] !== undefined && !nx.is(link.target, 'Object') && nodeIndexMap[link.target] !== undefined) {
                        _data.links.push({
                            source: nodeIndexMap[link.source],
                            target: nodeIndexMap[link.target]
                        });
                    }
                });

                // force
                var force = new nx.data.Force();
                force.setData(data);

                if (_data.nodes.length < 50) {
                    while (true) {
                        force.tick();
                        if (force.maxEnergy < 1) {
                            break;
                        }
                    }
                } else {
                    var step = 0;
                    while (++step < 300) {
                        force.tick();
                    }
                }

                return data;
            }
        }
    });

})(nx, nx.util, nx.global, nx.logger);
(function (nx, util, global) {
    nx.define("nx.data.ObservableGraph.QuickProcessor", {
        methods: {
            process: function (data, key, model) {
                nx.each(data.nodes, function (node) {
                    node.x = Math.floor(Math.random() * model.width());
                    node.y = Math.floor(Math.random() * model.height());
//                    node.x = Math.floor(Math.random() * 100);
//                    node.y = Math.floor(Math.random() * 100);
                });
                return data;
            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {
    nx.define("nx.data.ObservableGraph.CircleProcessor", {
        methods: {
            process: function (data) {

            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global, logger) {


    'use strict';

    /**
     * ObservableGraph class
     * @extend nx.data.ObservableObject
     * @class nx.data.ObservableGraph
     * @module nx.data
     */
    var GRAPH = nx.define('nx.data.ObservableGraph', nx.data.ObservableObject, {
        statics: {
            dataProcessor: {
                'force': new nx.data.ObservableGraph.ForceProcessor(),
                'quick': new nx.data.ObservableGraph.QuickProcessor(),
                'circle': new nx.data.ObservableGraph.CircleProcessor()
            },
            /**
             * Register graph data processor,
             * @static
             * @method registerDataProcessor
             * @param {String} name data processor name
             * @param {Object} cls processor instance, instance should have a process method
             */
            registerDataProcessor: function (name, cls) {
                GRAPH.dataProcessor[name] = cls;
            }
        },
        event: ['addVertex', 'removeVertex', 'updateVertex', 'updateVertexCoordinate', 'addEdge', 'removeEdge', 'updateEdge', 'addEdgeSet', 'removeEdgeSet', 'updateEdgeSet', 'addVertexSet', 'removeVertexSet', 'updateVertexSet', 'updateVertexSetCoordinate', 'setData', 'insertData', 'clear', 'startGenerate', 'endGenerate'],
        properties: {
            /**
             * Use this attribute of original data as vertex's id and link's mapping key
             * default is index, if not set use array's index as id
             * @property identityKey {String}
             * @default 'index'
             */
            identityKey: {
                value: 'index'
            },
            /**
             * Set pre data processor,it could be 'force'/'quick'
             * @property dataProcessor
             * @default undefined
             */
            dataProcessor: {},
            /**
             * If 'false', when vertex'position changed, will not write to original data
             * @property autoSave
             * @default true
             */
            autoSave: {
                value: true
            },
            /**
             * Set to re-write vertex's get/set x position method, it should include two function set & get
             * @property xMutatorMethod {Array}
             * @default undefined
             */
            xMutatorMethod: {},
            /**
             * Set to re-write vertex's get/set y position method, it should include two function set & get
             * @property yMutatorMethod {Array}
             * @default undefined
             */
            yMutatorMethod: {},
            width: {
                value: 100
            },
            height: {
                value: 100
            },
            ObservableVertex: {},
            ObservableEdge: {}
        },
        methods: {
            init: function (args) {
                this.init.__super__.apply(this, args);
                this._clear();
            },
            _clear: function () {
                this._originalData = {nodes: [], links: [], nodeSet: []};

                this.vertices = [];
                this.verticesMap = {};

                this.edges = [];
                this.edgesMap = {};

                this._edgeSet = [];
                this._edgeSetMap = {};

                this._vertexSet = [];
                this._vertexSetMap = {};

                //[TODO] observable collection
                //this.ObservableVertex()


                this.fire('clear');
            },

            /**
             * Set data, data should follow Common Topology Data Definition
             * @method setData
             * @param {Object} inData
             */
            setData: function (inData) {

                this._clear();

                this._originalData.nodes = inData.nodes || [];
                this._originalData.links = inData.links || [];
                this._originalData.nodeSet = inData.nodeSet || [];

                var data = this._preProcessData(this._originalData);

                // process
                this._processData(data);

                /**
                 * Trigger when set data to ObservableGraph
                 * @event setData
                 * @param sender {Object}  event trigger
                 * @param {Object} data data, which been processed by data processor
                 */

                this.fire('setData', data);


            },
            /**
             * Insert data, data should follow Common Topology Data Definition
             * @method insertData
             * @param {Object} inData
             */
            insertData: function (inData) {
                //migrate orginal data
                this._originalData.nodes = this._originalData.nodes.concat(inData.nodes || []);
                this._originalData.links = this._originalData.links.concat(inData.links || []);
                this._originalData.nodeSet = this._originalData.nodeSet.concat(inData.nodeSet || []);


                var data = this._preProcessData(this._originalData);

                // process
                this._processData(data);

                /**
                 * Trigger when insert data to ObservableGraph
                 * @event insertData
                 * @param sender {Object}  event trigger
                 * @param {Object} data data, which been processed by data processor
                 */

                this.fire('insertData', data);

            },

            _preProcessData: function (data) {
                var identityKey = this._identityKey;
                var dataProcessor = this._dataProcessor;

                //TODO data validation

                if (dataProcessor) {
                    var processor = GRAPH.dataProcessor[dataProcessor];
                    if (processor) {
                        return processor.process(data, identityKey, this);
                    } else {
                        return data;
                    }
                } else {
                    return data;
                }
            },

            _processData: function (data) {
                nx.each(data.nodes, this._addVertex, this);

                nx.each(data.links, this._addEdge, this);

                nx.each(data.nodeSet, this._addVertexSet, this);

                //after initializing
                nx.each(this._vertexSet, this._processVertexSet, this);

                this._generate();
            },
            /**
             * Get original data
             * @returns {Object}
             */

            getData: function () {
                var data = nx.clone(this._originalData);
                if (data.nodeSet.length === 0) {
                    delete data.nodeSet;
                }
                return data;
            },

            /**
             * Add vertex to Graph
             * @method addVertex
             * @param {JSON} data Vertex original data
             * @param {Object} [inOptions] Config object
             * @param {Boolean} [isGenerate=true] If 'true',not trigger generate process.
             * @returns {nx.data.Vertex}
             */
            addVertex: function (data, inOptions, isGenerate) {

                this._originalData.nodes.push(data);

                var vertex = this._addVertex(data, inOptions);

                if (isGenerate !== false) {
                    vertex.generated(true);
                    /**
                     * @event addVertex
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.Vertex} vertex Vertex object
                     */
                    this.fire('addVertex', vertex);
                }
                return vertex;
            },
            /**
             * Remove a vertex from Graph
             * @method removeVertex
             * @param {nx.data.Vertex} vertex Vertex object
             * @returns {Boolean}
             */
            removeVertex: function (vertex, isNotifyParentVertexSet) {

                vertex.eachConnectedEdgeSet(function (edgeSet) {
                    this._removeEdgeSet(edgeSet);
                }, this);


                this.vertices = util.without(this.vertices, vertex);
                delete this.verticesMap[vertex.id()];

                if (isNotifyParentVertexSet !== false) {
                    var vertexSet = vertex.parentVertexSet();
                    if (vertexSet) {
                        vertexSet.removeVertex(vertex);
                    }
                }

                /**
                 * @event removeVertex
                 * @param sender {Object}  Trigger instance
                 * @param {nx.data.Vertex} vertex Vertex object
                 */

                this.fire('removeVertex', vertex);

                return vertex.destroy();
            },

            /**
             * Add edge to Graph
             * @method addEdge
             * @param {JSON} data Vertex original data
             * @param {Object} [inOptions] Config object
             * @param {Boolean} [isGenerate=true] If 'true',not trigger generate process.
             * @returns {nx.data.Edge}
             */

            addEdge: function (data, inOptions, isGenerate) {

                if (!(inOptions && inOptions.virtual)) {
                    this._originalData.links.push(data);
                }

                var edge = this._addEdge(data, inOptions);

                if (edge && isGenerate !== false) {
                    var edgeSet = edge.parentEdgeSet();
                    if (edgeSet.generated()) {
                        if (!edgeSet.activated()) {
                            /**
                             * @event addEdge
                             * @param sender {Object}  Trigger instance
                             * @param {nx.data.Edge} edge Edge object
                             */
                            this.fire('addEdge', edge);
                        }
                        this.fire('updateEdgeSet', edgeSet);
                    } else {
                        edgeSet.generated(true);
                        /**
                         * @event addEdgeSet
                         * @param sender {Object}  Trigger instance
                         * @param {nx.data.EdgeSet} edgeSet EdgeSet object
                         */
                        this.fire('addEdgeSet', edgeSet);

                    }

                }
                return edge;
            },
            /**
             * Remove edge from Graph
             * @method removeEdge
             * @param edge {nx.data.Edge} edge Edge object
             * @param isNotifyParentEdgeSet {Booleean}
             */
            removeEdge: function (edge, isNotifyParentEdgeSet) {
                var edgeSet = edge.parentEdgeSet();
                edgeSet.removeEdge(edge);

                /**
                 * @event removeEdge
                 * @param sender {Object}  Trigger instance
                 * @param {nx.data.Edge} edge Edge object
                 */
                this.fire('removeEdge', edge);


                edge.source().removeEdge(edge);
                edge.target().removeEdge(edge);

                if (isNotifyParentEdgeSet !== false) {
                    this.fire('updateEdgeSet', edgeSet);
                }

                this.edges.splice(this.edges.indexOf(edge), 1);
                delete this.edgesMap[edge.id()];

            },

            _addEdgeSet: function (config) {
                var edgeSet = new nx.data.EdgeSet();
                var id = edgeSet.__id__;
                edgeSet.graph(this);
                edgeSet.sets(config);
                edgeSet.id(id);
                this._edgeSetMap[config.linkKey] = edgeSet;
                this._edgeSet.push(edgeSet);
                return edgeSet;
            },


            _removeEdgeSet: function (edgeSet) {
                edgeSet.eachEdges(function (edge) {
                    if (edge.type() == 'edgeSet') {
                        this._removeEdgeSet(edge);
                    } else {
                        this.removeEdge(edge, false);
                    }
                }, this);

                this._edgeSet.splice(this._edgeSet.indexOf(edgeSet), 1);
                delete this._edgeSetMap[edgeSet.linkKey()];

                /**
                 * @event removeEdgeSet
                 * @param sender {Object}  Trigger instance
                 * @param {nx.data.EdgeSet} edgeSet EdgeSet object
                 */
                this.fire('removeEdgeSet', edgeSet);
            },

            /**
             * Add vertex set to Graph
             * @method addVertexSet
             * @param {JSON} data Vertex set original data, which include nodes(Array) attribute. That is node's ID collection.  e.g. {nodes:[id1,id2,id3]}
             * @param {Object} [inOptions] Config object
             * @param {Boolean} [isGenerate=true] If 'true',not trigger generate process.
             * @returns {nx.data.VertexSet}
             */
            addVertexSet: function (data, inOptions, isGenerate) {

                this._originalData.nodeSet.push(data);

                var vertexSet = this._addVertexSet(data, inOptions);

                if (isGenerate !== false) {
                    var addedVirtualEdgeSet = this._processVertexSet(vertexSet);
                    /**
                     * @event addVertexSet
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.VertexSet} vertexSet VertexSet object
                     */
                    this.fire('addVertexSet', vertexSet);

                    nx.each(addedVirtualEdgeSet, function (edgeSet) {
                        this.fire('addEdgeSet', edgeSet);
                    }, this);
                }
                return vertexSet;
            },
            /**
             * Remove a vertex set from Graph
             * @method removeVertexSet
             * @param {nx.data.VertexSet} vertexSet VertexSet object
             * @returns {Boolean}
             */
            removeVertexSet: function (vertexSet) {
                //[todo]

            },

            _addVertex: function (data, config) {
                var vertices = this.vertices;
                var verticesLength = vertices.length;
                var identityKey = this.identityKey();
                //
                if (!nx.is(data, 'Object')) {
                    data = {data: data};
                }
                var id = data[identityKey] !== undefined ? data[identityKey] : verticesLength;
                var vertex = new nx.data.Vertex(data);


                var xMutatorMethod = this.xMutatorMethod();
                if (xMutatorMethod) {
                    vertex.getXPath(xMutatorMethod[0]);
                    vertex.setXPath(xMutatorMethod[1]);
                }


                var yMutatorMethod = this.yMutatorMethod();
                if (yMutatorMethod) {
                    vertex.getYPath(yMutatorMethod[0]);
                    vertex.setYPath(yMutatorMethod[1]);
                }

                //
                vertex.graph(this);
                vertex.autoSave(this.autoSave());
                vertex.id(id);


                if (config) {
                    vertex.sets(config);
                }

                vertex.setPosition();

                vertex.on('updateCoordinate', function () {
                    /**
                     * @event updateVertexCoordinate
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.Vertex} vertex Vertex object
                     */
                    this.fire('updateVertexCoordinate', vertex);
                }, this);

                vertices.push(vertex);
                this.verticesMap[id] = vertex;

                return vertex;
            },

            _addEdge: function (data, inOption) {
                var identityKey = this.identityKey();
                var source, target, sourceID, targetID;

                sourceID = nx.is(data.source, 'Object') ? data.source[identityKey] : data.source;
                source = this.verticesMap[sourceID] || this._vertexSetMap[sourceID];


                targetID = nx.is(data.target, 'Object') ? data.target[identityKey] : data.target;
                target = this.verticesMap[targetID] || this._vertexSetMap[targetID];


                if (source && target) {
                    var linkKey = sourceID + '_' + targetID;
                    var reverseLinkKey = targetID + '_' + sourceID;


                    var edge = new nx.data.Edge(data);
                    var id = data.id === undefined ? edge.__id__ : data.id;

                    edge.sets({
                        id: id,
                        source: source,
                        target: target,
                        sourceID: sourceID,
                        targetID: targetID,
                        graph: this
                    });
                    if (inOption) {
                        edge.sets(inOption);
                    }
                    source.addEdge(edge);
                    target.addReverseEdge(edge);

                    this.edgesMap[id] = edge;
                    this.edges.push(edge);


                    var edgeSetMap = this._edgeSetMap;


                    var edgeSet = edgeSetMap[linkKey] || edgeSetMap[reverseLinkKey];
                    if (!edgeSet) {
                        edgeSet = this._addEdgeSet({
                            source: source,
                            target: target,
                            sourceID: sourceID,
                            targetID: targetID,
                            linkKey: linkKey,
                            reverseLinkKey: reverseLinkKey
                        });
                    } else {
                        edgeSet.updated(true);
                    }

                    edge.sets({
                        linkKey: edgeSet.linkKey(),
                        reverseLinkKey: edgeSet.reverseLinkKey()
                    });

                    edgeSet.addEdge(edge);
                    edge.parentEdgeSet(edgeSet);
                    edge.reverse(linkKey !== edgeSet.linkKey());


                    return edge;

                } else {
                    if (console) {
                        console.log('source node or target node is not defined, or linkMappingKey value error', data, source, target);
                    }
                    return undefined;
                }
            },


            _addVertexSet: function (data, config) {
                var verticesLength = this._vertexSet.length + this.vertices.length;
                var identityKey = this.identityKey();
                //
                if (!nx.is(data, 'Object')) {
                    data = {data: data};
                }
                var vertexSetID = data[identityKey] !== undefined ? data[identityKey] : verticesLength;
                var vertexSet = new nx.data.VertexSet(data);

                //
                vertexSet.graph(this);
                vertexSet.type('nodeSet');
                vertexSet.autoSave(this.autoSave());
                vertexSet.id(vertexSetID);

                if (config) {
                    vertexSet.sets(config);
                }

                vertexSet.setPosition();

                vertexSet.on('updateCoordinate', function () {
                    /**
                     * @event updateVertexSetCoordinate
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.VertexSet} vertexSet VertexSet object
                     */
                    this.fire('updateVertexSetCoordinate', vertexSet);
                }, this);

//                this.vertices.push(vertexSet);
//                this.verticesMap[vertexSetID] = vertexSet;

                this._vertexSet.push(vertexSet);
                this._vertexSetMap[vertexSetID] = vertexSet;


                return vertexSet;
            },

            _processVertexSet: function (vertexSet) {
                var vertexSetID = vertexSet.id();
                var vertices = vertexSet.get('nodes');
                var addedVirtualEdgeSet = {};
                var connectedVertices = [];
                var connectedEdgeSetMap = {};
                var EdgeSet = {};
                var internalVertices = [];

                if (vertices) {
                    nx.each(vertices, function (internalID) {
                        var vertex = this.verticesMap[internalID] || this._vertexSetMap[internalID];
                        if (vertex && vertex.visible()) {

                            vertex.eachConnectedEdgeSet(function (edgeset, linkKey) {
                                //get another vertex
                                var _vertex = edgeset.sourceID() == internalID ? edgeset.target() : edgeset.source();
                                var id = _vertex.id();
                                if (_vertex.visible()) {
                                    //if _vertex not in the vertices
                                    if (vertices.indexOf(id) === -1) {
                                        connectedVertices.push(_vertex);
                                        //setup a edgeSetMap
                                        var map = connectedEdgeSetMap[id] = connectedEdgeSetMap[id] || [];
                                        map.push(edgeset);
                                    } else {
                                        edgeset.visible(false);
                                    }
                                    EdgeSet[linkKey] = edgeset;
                                }
                            }, this);
                            internalVertices.push(vertex);
                            vertexSet.addVertex(vertex);
                        }
                    }, this);

                    nx.each(internalVertices, function (vertex) {
                        vertex.visible(false);
                        if (vertex.activated) {
                            vertex._activated = true;
                        }
                    });


                    nx.each(connectedEdgeSetMap, function (edgeSet, id) {
                        if (vertexSetID !== parseInt(id, 10)) {
                            var edge = this._addEdge({
                                source: vertexSetID,
                                target: id
                            }, {virtual: true});

                            var _edgeSet = edge.parentEdgeSet();
                            _edgeSet.addVirtualEdges(edgeSet);
                            addedVirtualEdgeSet[_edgeSet.id()] = _edgeSet;
                        }

                    }, this);
                }

                vertexSet.addEdgeSet(EdgeSet);
                vertexSet._activated = true;
                return addedVirtualEdgeSet;
            },
            /**
             * Get vertex object by id
             * @method getVertex
             * @param id
             * @returns {nx.data.Vertex}
             */
            getVertex: function (id) {
                return this.verticesMap[id];
            },
            /**
             * Get edge object by id
             * @method getEdge
             * @param id
             * @returns {nx.data.Edge}
             */
            getEdge: function (id) {
                return this.edgesMap[id];
            },
            /**
             * Get vertex set object by id
             * @method getVertexSet
             * @param id
             * @returns {nx.data.VertexSet}
             */
            getVertexSet: function (id) {
                return this._vertexSetMap[id];
            },
            /**
             * Get edge set object by id
             * @method getEdgeSet
             * @param id
             * @returns {nx.data.EdgeSet}
             */
            getEdgeSet: function (id) {
                return this._edgeSetMap[id];
            },
            /**
             * Iterate each vertex item
             * @method eachVertex
             * @param fn {Function} callback function, param is a vertex object
             * @param context {Object} Context of callback function
             */
            eachVertex: function (fn, context) {
                nx.each(this.vertices, fn, context || this);
            },
            /**
             * Iterate each edge item
             * @method eachEdge
             * @param fn {Function} callback function, param is a edge object
             * @param context {Object} Context of callback function
             */
            eachEdge: function (fn, context) {
                nx.each(this._edges, fn, context || this);
            },
            /**
             * Iterate each visible vertex item
             * @method eachVisibleVertex
             * @param fn {Function} callback function, param is a vertex object
             * @param context {Object} Context of callback function
             */
            eachVisibleVertex: function (fn, context) {
                nx.each(this.vertices.concat(this._vertexSet), function (vertex) {
                    if (vertex.visible()) {
                        fn.call(context || this, vertex);
                    }
                }, context || this);
            },
            /**
             * Iterate each visible edge item
             * @method eachVisibleEdge
             * @param fn {Function} callback function, param is a edge object
             * @param context {Object} Context of callback function
             */
            eachVisibleEdge: function (fn, context) {
                nx.each(this._edges, function (edge) {
                    if (edge.visible()) {
                        fn.call(context || this, edge);
                    }
                }, context || this);
            },
            /**
             * Iterate each vertex set item
             * @method eachVertexSet
             * @param fn {Function} callback function, param is a vertexSet object
             * @param context {Object} Context of callback function
             */
            eachVertexSet: function (fn, context) {
                nx.each(this._vertexSet, fn, context || this);
            },
            /**
             * Get all visible vertex object
             * @method getVisibleVertices
             * @returns {Array}
             */
            getVisibleVertices: function () {
                var vertices = [];

                this.eachVisibleVertex(function (vertex) {
                    vertices.push(vertex);
                });
                return vertices;
            },
            /**
             * Get all visible edge objects
             * @method getVisibleEdges
             * @returns {Array}
             */
            getVisibleEdges: function () {
                var edges = [];
                this.eachVisibleEdge(function (edge) {
                    edges.push(edge);
                });
                return edges;
            },
            /**
             * Get edgeSet by source vertex id and target vertex id
             * @method getEdgeSetBySourceAndTarget
             * @param source {nx.data.Vertex|Number|String} could be vertex object or id
             * @param target {nx.data.Vertex|Number|String} could be vertex object or id
             * @returns {nx.data.EdgeSet}
             */
            getEdgeSetBySourceAndTarget: function (source, target) {
                var edgeSetMap = this._edgeSetMap;

                var sourceID = nx.is(source, 'Object') ? source.id() : source;
                var targetID = nx.is(target, 'Object') ? target.id() : target;

                var linkKey = sourceID + '_' + targetID;
                var reverseLinkKey = targetID + '_' + sourceID;

                return edgeSetMap[linkKey] || edgeSetMap[reverseLinkKey];
            },
            /**
             * Get edges by source vertex id and target vertex id
             * @method getEdgesBySourceAndTarget
             * @param source {nx.data.Vertex|Number|String} could be vertex object or id
             * @param target {nx.data.Vertex|Number|String} could be vertex object or id
             * @returns {Array}
             */
            getEdgesBySourceAndTarget: function (source, target) {
                var edgeSet = this.getEdgeSetBySourceAndTarget(source, target);
                return edgeSet && edgeSet.getEdges();
            },

            /**
             * Get edges which are connected to passed vertices
             * @method getEdgesByVertices
             * @param inVertices
             * @returns {Array}
             */
            getEdgesByVertices: function (inVertices) {
                var edges = [];
                nx.each(inVertices, function (vertex) {
                    edges = edges.concat(vertex.edges);
                    edges = edges.concat(vertex.reverseEdges);
                });


                return util.uniq(edges);
            },
            /**
             * Get edges which's source and target vertex are both in the passed vertices
             * @method getInternalEdgesByVertices
             * @param inVertices
             * @returns {Array}
             */

            getInternalEdgesByVertices: function (inVertices) {
                var edges = [];
                var verticesMap = {};
                var internalEdges = [];
                nx.each(inVertices, function (vertex) {
                    edges = edges.concat(vertex.edges);
                    edges = edges.concat(vertex.reverseEdges);
                    verticesMap[vertex.id()] = vertex;
                });

                nx.each(edges, function (edge) {
                    if (verticesMap[edge.sourceID()] !== undefined && verticesMap[edge.targetID()] !== undefined) {
                        internalEdges.push(edge);
                    }
                });


                return internalEdges;

            },
            /**
             * Get edges which's  just one of source or target vertex in the passed vertices. All edges connected ourside of passed vertices
             * @method getInternalEdgesByVertices
             * @param inVertices
             * @returns {Array}
             */
            getExternalEdgesByVertices: function (inVertices) {
                var edges = [];
                var verticesMap = {};
                var externalEdges = [];
                nx.each(inVertices, function (vertex) {
                    edges = edges.concat(vertex.edges);
                    edges = edges.concat(vertex.reverseEdges);
                    verticesMap[vertex.id()] = vertex;
                });

                nx.each(edges, function (edge) {
                    if (verticesMap[edge.sourceID()] === undefined || verticesMap[edge.targetID()] === undefined) {
                        externalEdges.push(edge);
                    }
                });


                return externalEdges;

            },


            _generate: function () {
                /**
                 * @event startGenerate
                 * @param sender {Object}  Trigger instance
                 */
                this.fire('startGenerate');

                nx.each(this.vertices, this._generateVertex, this);

                //nx.each(this.edges, this._generateEdge, this);

                nx.each(this._vertexSet, this._generateVertexSet, this);

                nx.each(this._edgeSet, this._generateEdgeSetMap, this);

                /**
                 * @event endGenerate
                 * @param sender {Object}  Trigger instance
                 */
                this.fire('endGenerate');

            },

            _generateVertex: function (vertex) {
                if (vertex.visible() && !vertex.generated()) {
                    vertex.generated(true);
                    this.fire('addVertex', vertex);
                } else if (vertex.generated() && vertex.updated()) {
                    vertex.updated(false);
                    /**
                     * @event updateVertex
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.Vertex} vertex Vertex object
                     */
                    this.fire('updateVertex', vertex);
                }
            },
            _generateEdge: function (edge) {
                if (!edge.generated() && edge.source().generated() && edge.target().generated()) { //edgeSet.visible() &&
                    edge.generated(true);
                    this.fire('addEdge', edge);
                } else if (edge.generated() && edge.updated()) {
                    edge.updated(false);
                    /**
                     * @event updateEdgeSet
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.EdgeSet} edgeSet EdgeSet object
                     */
                    this.fire('updateEdge', edge);
                }
            },
            _generateEdgeSetMap: function (edgeSet) {
                if (!edgeSet.generated() && edgeSet.source().generated() && edgeSet.target().generated()) { //edgeSet.visible() &&
                    edgeSet.generated(true);
                    this.fire('addEdgeSet', edgeSet);
                } else if (edgeSet.generated() && edgeSet.updated()) {
                    edgeSet.updated(false);
                    /**
                     * @event updateEdgeSet
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.EdgeSet} edgeSet EdgeSet object
                     */
                    this.fire('updateEdgeSet', edgeSet);
                }
            },
            _generateVertexSet: function (vertex) {
                if (vertex.visible() && !vertex.generated()) {
                    vertex.generated(true);
                    this.fire('addVertexSet', vertex);
                } else if (vertex.generated() && vertex.updated()) {
                    vertex.updated(false);
                    /**
                     * @event updateVertexSet
                     * @param sender {Object}  Trigger instance
                     * @param {nx.data.VertexSet} vertexSet VertexSet object
                     */
                    this.fire('updateVertexSet', vertex);
                }
            },

            /**
             * Get visible vertices data bound
             * @method getBound
             * @returns {{x: number, y: number, width: number, height: number, maxX: number, maxY: number}}
             */

            getBound: function (invertices) {

                var min_x, max_x, min_y, max_y;

                var vertices = invertices || this.getVisibleVertices();
                var firstItem = vertices[0];
                var x, y;

                if (firstItem) {
                    x = firstItem.get ? firstItem.get('x') : firstItem.x;
                    y = firstItem.get ? firstItem.get('y') : firstItem.y;
                    min_x = max_x = x || 0;
                    min_y = max_y = y || 0;
                } else {
                    min_x = max_x = 0;
                    min_y = max_y = 0;
                }


                nx.each(vertices, function (vertex, index) {
                    x = vertex.get ? vertex.get('x') : vertex.x;
                    y = vertex.get ? vertex.get('y') : vertex.y;
                    min_x = Math.min(min_x, x || 0);
                    max_x = Math.max(max_x, x || 0);
                    min_y = Math.min(min_y, y || 0);
                    max_y = Math.max(max_y, y || 0);
                });

                return {
                    x: min_x,
                    y: min_y,
                    width: max_x - min_x,
                    height: max_y - min_y,
                    maxX: max_x,
                    maxY: max_y
                };
            },
            /**
             * Save data to original data
             * @method save
             */
            save: function () {
                this.eachVertex(function (vertex) {
                    vertex.save();
                });
            },
            /**
             * Revers all vertices' original data
             * @method reset
             */
            reset: function () {
                this.eachVertex(function (vertex) {
                    vertex.reset();
                });
            }

        }
    });

})(nx, nx.util, nx.global, nx.logger);
(function (nx, util, global) {
    /**
     * Utility class for Projection
     * @class nx.data.Projection
     * @module nx.data
     */

    nx.define("nx.data.Projection", {
        properties: {
            /**
             * Get/set a input range
             * @property input {Array}
             * @default [0, 0]
             */
            input: {
                set: function (range) {
                    if (nx.is(range, 'Array')) {
                        this._input = range;
                    } else {
                        this._input = [0, parseInt(range, 10)];
                    }
                    this.rate("force");
                },
                get: function () {
                    return this._input || [0, 0];
                }
            },
            /**
             * Get/set a output range
             * @property output {Array}
             * @default [0, 0]
             */
            output: {
                set: function (range) {
                    if (nx.is(range, 'Array')) {
                        this._output = range;
                    } else {
                        this._output = [0, parseInt(range, 10)];
                    }
                    this.rate("force");
                },
                get: function () {
                    return this._output || [0, 0];
                }
            },
            /**
             * get a in/out rate
             * @property rate
             */
            rate: {
                set: function (value) {
                    var input = this.input();
                    var output = this.output();
                    if (input && output) {
                        this._rate = (input[1] - input[0]) / (output[1] - output[0]);
                    }
                },
                get: function () {
                    return this._rate;
                }
            },
            converter: {
                value: function () {
                    return {
                        convert: function (value) {
                            return this.get(value);
                        },
                        convertBack: function (value) {
                            return this.invert(value);
                        }
                    };
                }
            }
        },
        methods: {
            /**
             * Get projectioned value
             * @param value {Number}
             * @returns {Number}
             * @method get
             */
            get: function (value) {
                var input = this.input();
                var output = this.output();
                var rate = this.rate();
                if (!input || !output) {
                    return value;
                }
                if (rate === 0) {
                    return (output[1] + output[0]) / 2;
                } else {
                    return ((value || 0) - input[0]) / rate + output[0];
                }

            },
            /**
             * Get a invert projectioned value
             * @param value {Number}
             * @returns {Number}
             * @method invert
             */
            invert: function (value) {
                var input = this.input();
                var output = this.output();
                var rate = this.rate();
                return ((value || 0) - output[0]) * rate + input[0];
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Topology's base config
     * @class nx.graphic.Topology.Config
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.Config", {
        events: [],
        properties: {
            /**
             * Topology status, it could be  initializing/appended/ready
             * @property status {String}
             */
            status: {
                value: 'initializing'
            },
            /**
             * topology's theme, it could be blue/green/dark/slate/yellow
             * @property theme {String}
             */
            theme: {
                get: function () {
                    return this._theme || 'blue';
                },
                set: function (value) {
                    this._theme = value;
                    this.notify('themeClass');
                }
            },
            themeClass: {
                get: function () {
                    return 'n-topology-' + this.theme();
                }
            },
            /**
             * Set the navigation visibility
             * @property showNavigation {Boolean}
             */
            showNavigation: {
                value: true
            },
            showThumbnail: {
                value: false
            },
            /**
             * Get the setting panel component instance for extend user setting
             * @property viewSettingPanel {nx.ui.Component}
             * @readonly
             */
            viewSettingPanel: {
                get: function () {
                    return this.resolve("nav").resolve("customize");
                }
            }
        },
        methods: {
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Topology projection class
     * @class nx.graphic.Topology.Projection
     * @module nx.graphic.Topology
     */

    nx.define("nx.graphic.Topology.Projection", {
        events: ['projectionChange', 'zooming', 'zoomend', 'resetzooming', 'fitStage'],
        properties: {
            /**
             * Topology max scaling
             * @property maxScale {Number}
             */
            maxScale: {
                value: 12
            },
            /**
             * Topology min scaling
             * @property minScale {Number}
             */
            minScale: {
                value: 0.2
            },
            /**
             * Set/get topology's scalability
             * @property scalable {Boolean}
             */
            scalable: {
                value: true
            },
            /**
             * Set/get topology's current scale
             * @property scale {Number}
             */
            scale: {
                get: function () {
                    return this._scale || 1;
                },
                set: function (value) {
                    var scale = Math.max(Math.min(this._maxScale, value), this._minScale);
                    if (scale !== this._scale) {
                        this._zoom(scale);
                    }
                }
            },
            revisionScale: {
                get: function () {
                    return this._revisionScale !== undefined ? this._revisionScale : 1;
                },
                set: function (value) {
                    if (this._revisionScale !== value) {
                        this._revisionScale = value;
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            scaleX: {
                get: function () {
                    return this.projectionX();
                }
            },
            scaleY: {
                get: function () {
                    return this.projectionY();
                }
            },
            /**
             * Get topology x axle projection
             * @property projectionX {nx.data.Projection}
             * @readonly
             */
            projectionX: {
                value: function () {
                    return new nx.data.Projection();
                }
            },
            /**
             * Get topology y axle projection
             * @property projectionY {nx.data.Projection}
             * @readonly
             */
            projectionY: {
                value: function () {
                    return new nx.data.Projection();
                }
            },
            /**
             * Set/get is topology use projection, or just use the data's original position information
             * @property enableProjection {Boolean}
             */
            enableProjection: {
                value: true
            },
            /**
             * Set the x projection input range e.g. [0,100]
             * @projectionXRange {Array}
             */
            projectionXRange: {
            },
            /**
             * Set the y projection input range e.g. [0,100]
             * @projectionYRange {Array}
             */
            projectionYRange: {
            },
            /**
             * Enabling gradual scaling feature when zooming, set to false will improve the performance
             * @property enableGradualScaling {Boolean}
             */
            enableGradualScaling: {
                value: true
            },
            /**
             * Enabling the smart node feature, set to false will improve the performance
             * @property enableSmartNode {Boolean}
             */
            enableSmartNode: {
                value: true
            }
        },
        methods: {
            _setProjection: function (force, isNotify) {
                var graph = this.graph();
                var visibleContainerWidth = this.containerWidth();
                var visibleContainerHeight = this.containerHeight();

                //

                if (visibleContainerWidth === 0 && visibleContainerWidth === 0) {
                    return;
                }


                var projectionX = this.projectionX();
                var projectionY = this.projectionY();


                var enableProjection = this.enableProjection();
                var projectionXRange = this.projectionXRange();
                var projectionYRange = this.projectionYRange();

                var bound;

                if (force || !this._dataBound) {
                    bound = this._dataBound = graph.getBound();
                } else {
                    bound = this._dataBound;
                }


                var xInput, xOutput, yInput, yOutput;


                if (enableProjection) {

                    if (projectionXRange) {
                        bound.x = Math.min(projectionXRange[0], projectionXRange[1]);
                        bound.maxX = Math.max(projectionXRange[0], projectionXRange[1]);
                        bound.width = Math.abs(projectionXRange[0] - projectionXRange[1]);

                    }

                    if (projectionYRange) {
                        bound.y = Math.min(projectionYRange[0], projectionYRange[1]);
                        bound.maxY = Math.max(projectionYRange[0], projectionYRange[1]);
                        bound.height = Math.abs(projectionYRange[0] - projectionYRange[1]);
                    }


                    if (bound.width === 0 && bound.height === 0) {
                        xInput = [bound.x - visibleContainerWidth / 2, bound.x + visibleContainerWidth / 2];
                        xOutput = [0, visibleContainerWidth];

                        yInput = [bound.y - visibleContainerHeight / 2, bound.y + visibleContainerHeight / 2];
                        yOutput = [0, visibleContainerHeight];
                    } else if (bound.width === 0) {
                        xInput = [bound.x - visibleContainerWidth / 2, bound.x + visibleContainerWidth / 2];
                        xOutput = [0, visibleContainerWidth];

                        yInput = [bound.y, bound.maxY];
                        yOutput = [0, visibleContainerHeight];
                    } else if (bound.height === 0) {
                        xInput = [bound.x, bound.maxX];
                        xOutput = [0, visibleContainerWidth];

                        yInput = [bound.y - visibleContainerHeight / 2, bound.y + visibleContainerHeight / 2];
                        yOutput = [0, visibleContainerHeight];
                    } else {
                        var heightRate = visibleContainerHeight / bound.height;
                        var widthRate = visibleContainerWidth / bound.width;
                        if (heightRate < widthRate) {
                            var _width = bound.width * heightRate;

                            xInput = [bound.x, bound.maxX];
                            xOutput = [visibleContainerWidth / 2 - _width / 2, visibleContainerWidth / 2 + _width / 2];

                            yInput = [bound.y, bound.maxY];
                            yOutput = [0, visibleContainerHeight];
                        } else {
                            var _height = bound.height * widthRate;
                            xInput = [bound.x, bound.maxX];
                            xOutput = [0, visibleContainerWidth];

                            yInput = [bound.y, bound.maxY];
                            yOutput = [visibleContainerHeight / 2 - _height / 2, visibleContainerHeight / 2 + _height / 2];
                        }
                    }


                } else {
                    this.padding(0);

                    visibleContainerWidth = this.width();
                    visibleContainerHeight = this.height();
                    var scale = this.scale();


                    if (projectionXRange) {
                        xInput = [projectionXRange[0], projectionXRange[1]];
                        xOutput = [0, scale * visibleContainerWidth];
                    } else {
                        xInput = [0, visibleContainerWidth];
                        xOutput = [0, scale * visibleContainerWidth];
                    }

                    if (projectionYRange) {
                        yInput = [projectionYRange[0], projectionYRange[1]];
                        yOutput = [0, scale * visibleContainerHeight];
                    } else {
                        yInput = [0, visibleContainerHeight];
                        yOutput = [0, scale * visibleContainerHeight];
                    }

                }

                var isUpdate = false;
                var _xInput = projectionX.input(), _xOutput = projectionX.output(), _yInput = projectionY.input(), _yOutput = projectionY.output();


                if (_xInput[0] !== xInput[0] || _xInput[1] !== xInput[1]) {
                    projectionX.input(xInput);
                    isUpdate = true;
                }

                if (_xOutput[0] !== xOutput[0] || _xOutput[1] !== xOutput[1]) {
                    projectionX.output(xOutput);
                    isUpdate = true;
                }

                if (_yInput[0] !== yInput[0] || _yInput[1] !== yInput[1]) {
                    projectionY.input(yInput);
                    isUpdate = true;
                }

                if (_yOutput[0] !== yOutput[0] || _yOutput[1] !== yOutput[1]) {
                    projectionY.output(yOutput);
                    isUpdate = true;
                }


                if (isNotify !== false && isUpdate) {
                    /**
                     * Fired when topology projection changed
                     * @event projectionChange
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire("projectionChange");
                }
            },
            /**
             * Get a x axle projected value, eg, you pass a model's x position value, will return the x position on the screen
             * @method getProjectedX
             * @param value {Number}
             * @returns {Number}
             */
            getProjectedX: function (value) {
                return this.projectionX().get(value) || value;
            },
            /**
             * Get a y axle projected value, eg, you pass a model's x position value, will return the y position on the screen
             * @method getProjectedY
             * @param value {Number}
             * @returns {Number}
             */
            getProjectedY: function (value) {
                return this.projectionY().get(value) || value;
            },
            /**
             * Get a projected positon object, eg, you pass a model's position value, will return the position on the screen
             * @method getProjectedPosition
             * @param position {Object} {x:Number,y:Number}
             * @returns {Object}  {x:Number,y:Number}
             */
            getProjectedPosition: function (position) {
                return{
                    x: this.projectionX().get(position.x),
                    y: this.projectionY().get(position.y)
                };
            },
            _getScaleTranslate: function () {
                var stage = this.stage();
                var width = this.width();
                var height = this.height();
                var scale = Math.max(Math.min(this._maxScale, this._scale), this._minScale);
                var _scale = this._prevScale || 1;
                var step = scale - _scale;
                var translateX = stage.translateX();
                var translateY = stage.translateY();
                var _zoomCenterPoint = this._zoomCenterPoint;

                if (!_zoomCenterPoint) {
                    _zoomCenterPoint = {
                        x: width / 2,
                        y: height / 2
                    };
                }

                var x = (_zoomCenterPoint.x - translateX) / _scale * step;
                var y = (_zoomCenterPoint.y - translateY) / _scale * step;

                return{
                    x: translateX - x,
                    y: translateY - y
                };
            },

            _zoom: function (inScale, inAnimationTime, inFN) {
                var stage = this.stage();
                var scale = this._scale = Math.max(Math.min(this._maxScale, inScale), this._minScale);
                var finialScale = this._finialScale || 1;
                var translate = this._getScaleTranslate();

                if (this.__zoomTimer) {
                    clearTimeout(this.__zoomTimer);
                }

                var completeFN = function () {
                    this._setProjection();
                    stage.setTransform(translate.x, translate.y, 1, 0);
                    this._finialScale = this._scale;
                    if (inFN) {
                        inFN.call(this);
                    }
                    /**
                     * Fired when zooming is end
                     * @event zoomend
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire("zoomend");

                    stage.upon('transitionend', null, this);
                }.bind(this);

                /**
                 * Fired when zooming the topology
                 * @event zooming
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire("zooming");

                stage.setTransform(translate.x, translate.y, scale / finialScale, inAnimationTime || 0);

                if (inAnimationTime) {
                    stage.upon('transitionend', completeFN, this);
                } else {
                    this.__zoomTimer = setTimeout(completeFN, 50);
                }
                this._prevScale = scale;


                this.notify('scale');
            },
            _gradualZoom: function () {
                var stage = this.stage();
                var scale = this._scale = Math.max(Math.min(this._maxScale, this.scale()), this._minScale);
                var finialScale = this._finialScale || 1;
                var translate = this._getScaleTranslate();

                if (this.__zoomTimer) {
                    clearTimeout(this.__zoomTimer);
                }


                if (!this.__zoomIndex) {
                    this.__zoomIndex = 1;
                }


                var resetScaleFN = function () {
                    this._setProjection();
                    stage.setTransform(translate.x, translate.y, 1, 0);
                    this._finialScale = this._scale;
                };


                if (this.__zooming) {

                    this.fire("zooming");

                    if (this.enableGradualScaling()) {
                        if ((++this.__zoomIndex) % 10 !== 0) {
                            stage.setTransform(translate.x, translate.y, scale / finialScale, 0);
                        } else {
                            resetScaleFN.call(this);
                            /**
                             * If enabled enableGradualScaling, this event will fired when reset the scaling during zooming
                             * @event resetzooming
                             * @param sender{Object} trigger instance
                             * @param event {Object} original event object
                             */
                            this.fire("resetzooming");
                        }
                    } else {
                        stage.setTransform(translate.x, translate.y, scale / finialScale, 0);
                    }

                    this.fire("zooming");


                    this.__zoomTimer = setTimeout(this._gradualZoom.bind(this), 50);
                    this._prevScale = this._scale;
                } else {
                    resetScaleFN.call(this);
                    this.__zoomIndex = 0;
                    this.fire('zoomend');
                }

                this.notify('scale');
            },

            /**
             * Zoom topology
             * @param value {Number}
             * @method zoom
             */
            zoom: function (value) {
                delete this._zoomCenterPoint;
                this._zoom(value, 0.6);
            },

            /**
             * Make topology graphic fit stage
             * @method fit
             */
            fit: function (callback, duration) {
                this.zoomByBound(null, function () {
                    this._scale = 1;
                    this._recoverStageScale(this.paddingLeft(), this.paddingTop());
                    this.__originalStageBound = this.getInsideBound();
                    if (callback) {
                        callback.call(this);
                    }
                    this.fire('fitStage');
                }, {x: 30, y: 30}, duration); //for fix
            },
            /**
             * Zoom topology by a bound
             * @method zoomByBound
             * @param inBound {Object} e.g {left:Number,top:Number,width:Number,height:Number}
             * @param [callback] {Function} callback function
             * @param [offset] {Object} set the bound calculation offset
             * @param [duration] {Number} set the transition time, unit is second
             */
            zoomByBound: function (inBound, callback, offset, duration) {
                var stage = this.stage();
                var width = this.visibleContainerWidth();
                var height = this.visibleContainerHeight();
                var bound = inBound || this.getInsideBound();
                var stageTranslate = stage.translate();
                var _offset = offset || {x: 0, y: 0};
                var wScale = width / (bound.width - _offset.x);
                var hScale = height / (bound.height - _offset.y);
                var _scale = Math.min(wScale, hScale);
                var tx, ty;


                //avoid repeatily
                if (this.__originalStageBound) {
                    if (this.__originalStageBound.left == bound.left &&
                        this.__originalStageBound.top == bound.top &&
                        this.__originalStageBound.width == bound.width &&
                        this.__originalStageBound.height == bound.height) {
                        return;
                    }
                }


                _scale = Math.max(Math.min(this._maxScale, _scale), this._minScale);


                if (width / height < bound.width / bound.height) {
                    tx = this.paddingLeft() - (bound.left - stageTranslate.x) * _scale;
                    ty = (this.paddingTop() + height / 2 - bound.height * _scale / 2 ) - (bound.top - stageTranslate.y) * _scale;

                } else {
                    tx = (this.paddingLeft() + width / 2 - bound.width * _scale / 2 ) - (bound.left - stageTranslate.x) * _scale;
                    ty = this.paddingTop() - (bound.top - stageTranslate.y) * _scale;
                }

                stage.upon('transitionend', function zoomByBoundCallback() {
                    if (callback) {
                        callback.call(this);
                    }

                    this.fire("zoomend");

                    stage.upon('transitionend', null, this);
                }, this);

                this.fire("zooming");

                if (duration === 0) {
                    stage.setTransform(tx, ty, _scale, 0);
                    stage.fire('transitionend');
                } else {
                    stage.setTransform(tx, ty, _scale, duration || 0.5);
                }


                this._scale = _scale * this.scale();

                this.__originalStageBound = bound;

                this.notify('scale');

            },
            /**
             * Zoom topology to let the passing nodes just visible at the screen
             * @method zoomByNodes
             * @param nodes {Array} nodes collection
             */
            zoomByNodes: function (nodes) {
                var bound = this.getBoundByNodes(nodes);
                this.zoomByBound(bound, this._recoverStageScale.bind(this));

            },
            _recoverStageScale: function (translateX, translateY) {
                var tx = translateX !== undefined ? translateX : this.stage().translateX();
                var ty = translateY !== undefined ? translateY : this.stage().translateY();
                this._setProjection(true);
                this.stage().setTransform(tx, ty, 1, 0);
                this._finialScale = this._prevScale = this._scale;
            },

            /**
             * Get absolute position in the screen
             * @method getAbsolutePosition
             * @param point {Object} inside point position
             */
            getAbsolutePosition: function (point) {
                var tx = this.stage().translateX();
                var ty = this.stage().translateY();
                var offset = this.view().dom().getOffset();
                return {
                    x: tx + point.x + offset.left,
                    y: ty + point.y + offset.top
                };
            },
            /**
             * If enable enableSmartNode, this function will auto adjust the node's overlapping and set the nodes to right size
             * @method adjustLayout
             */
            adjustLayout: function () {


                if (!this.enableSmartNode()) {
                    return;
                }

                if (this._adjustLayoutTimer) {
                    clearTimeout(this._adjustLayoutTimer);
                }
                this._adjustLayoutTimer = setTimeout(function () {

                    var model = this.graph();

                    if (model) {
                        var nodesLayer = this.getLayer('nodes');
                        var length = nodesLayer.nodes().length;


                        if (length !== 0) {
                            var bound = nodesLayer.getBound();
                            var threshold = this.showIcon() ? 12000 : 3000;
                            var percell = (bound.width * bound.height) / length;
                            var revisionScale;

                            if (length < 3) {
                                revisionScale = 1;
                            } else if (percell < threshold / 2) {
                                revisionScale = 0.4;
                            } else if (percell < threshold / 1.5) {
                                revisionScale = 0.6;
                            } else if (percell < threshold) {
                                revisionScale = 0.8;
                            } else {
                                revisionScale = 1;
                            }

                            this.revisionScale(revisionScale);
                        }
                    }
                }.bind(this), 60);
            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Topology graph model class
     * @class nx.graphic.Topology.Graph
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.Graph", {
        events: ['beforeSetData', 'afterSetData', 'insertData', 'topologyGenerated'],
        properties: {
            /**
             * Identity the node and link mapping key, default is index
             * @property identityKey {String}
             */
            identityKey: {
                get: function () {
                    return this._identiyKey || 'index';
                },
                set: function (value) {
                    this._identiyKey = value;
                    this.graph().set('identityKey', value);
                }
            },
            /**
             * set/get the topology' data, data should follow Common Topology Data Definition
             * @property data {JSON}
             */
            data: {
                get: function () {
                    return this.graph().getData();
                },
                set: function (value) {

                    var fn = function (data) {
                        if (!data) {
                            return;
                        }
                        /**
                         * Fired before start process data
                         * @event beforeSetData
                         * @param sender {Object} Trigger instance
                         * @param data {JSON}  event object
                         */
                        this.fire("beforeSetData", data);
                        this.clear();
                        this.graph().sets({
                            width: this.visibleContainerWidth(),
                            height: this.visibleContainerHeight()
                        });
                        // set Data;
                        this.graph().setData(data);
                        //
                        /**
                         * Fired after process data
                         * @event afterSetData
                         * @param sender{Object} trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire("afterSetData", data);
                    };

                    if (this.status() === 'appended') {
                        fn.call(this, value);
                    } else {
                        this.on('ready', function () {
                            fn.call(this, value);
                        }, this);
                    }
                }
            },
            /**
             * Set the use force layout, recommand use dataProcessor:'force'
             * @property autoLayout {Boolean}
             */
            autoLayout: {
                get: function () {
                    return this._autoLayout || false;
                },
                set: function (value) {
                    this._autoLayout = value;
                    if (value) {
                        this.graph().dataProcessor("force");
                    } else {
                        this.graph().dataProcessor("");
                    }
                }
            },
            /**
             * Node x position mutator function, it is a array with two function item, first is setter and another is getter
             * @property xMutatorMethod {Array}
             */
            xMutatorMethod: {
                get: function () {
                    return this._xMutatorMethod || false;
                },
                set: function (value) {
                    this._xMutatorMethod = value;
                    this.graph().set('xMutatorMethod', value);
                }
            },
            /**
             * Node y position mutator function, it is a array with two function item, first is setter and another is getter
             * @property yMutatorMethod {Array}
             */
            yMutatorMethod: {
                get: function () {
                    return this._yMutatorMethod || false;
                },
                set: function (value) {
                    this._yMutatorMethod = value;
                    this.graph().set('yMutatorMethod', value);
                }
            },
            /**
             * Pre data processor, it could be 'force'/'quick'. It could also support register a new processor
             * @property dataProcessor {String}
             */
            dataProcessor: {
                get: function () {
                    return this._dataProcessor || false;
                },
                set: function (value) {
                    this._dataProcessor = value;
                    this.graph().set('dataProcessor', value);
                }
            },
            /**
             * Topology graph object
             * @property graph {nx.data.ObservableGraph}
             * @readonly
             */
            graph: {
                value: function () {
                    return new nx.data.ObservableGraph();
                }
            }
        },
        methods: {
            initGraph: function () {
                var graph = this.graph();
                graph.sets({
                    xMutatorMethod: this.xMutatorMethod(),
                    yMutatorMethod: this.yMutatorMethod(),
                    identityKey: this.identityKey(),
                    dataProcessor: this.dataProcessor()
                });

                if (this.autoLayout()) {
                    graph.dataProcessor("force");
                }


                var nodesLayer = this.getLayer("nodes");
                var linksLayer = this.getLayer("links");
                var nodeSetLayer = this.getLayer("nodeSet");
                var linkSetLayer = this.getLayer("linkSet");

                graph.on("addVertex", function (sender, vertex) {
                    nodesLayer.addNode(vertex);
                }, this);

                graph.on("removeVertex", function (sender, vertex) {
                    nodesLayer.removeNode(vertex);
                }, this);

                graph.on("updateVertex", function (sender, vertex) {
                    nodesLayer.updateNode(vertex);
                }, this);

                graph.on("updateVertexCoordinate", function (sender, vertex) {

                }, this);

                graph.on("addEdge", function (sender, edge) {
                    if (edge.source().generated() && edge.target().generated()) {
                        linksLayer.addLink(edge);
                    }
                }, this);

                graph.on("removeEdge", function (sender, edge) {
                    linksLayer.removeLink(edge);
                }, this);
                graph.on("updateEdge", function (sender, edge) {
                    linksLayer.updateLink(edge);
                }, this);
                graph.on("addEdgeSet", function (sender, edgeSet) {
                    if (edgeSet.source().generated() && edgeSet.target().generated()) {
                        if (this.supportMultipleLink()) {
                            linkSetLayer.addLinkSet(edgeSet);
                        } else {
                            edgeSet.activated(false);
                        }
                    }
                }, this);

                graph.on("removeEdgeSet", function (sender, edgeSet) {
                    if (this.supportMultipleLink()) {
                        linkSetLayer.removeLinkSet(edgeSet);
                    }
                }, this);
                graph.on("updateEdgeSet", function (sender, edgeSet) {
                    if (this.supportMultipleLink()) {
                        linkSetLayer.updateLinkSet(edgeSet);
                    }
                }, this);


                graph.on("addVertexSet", function (sender, vertexSet) {
                    nodeSetLayer.addNodeSet(vertexSet);
                }, this);

                graph.on("removeVertexSet", function (sender, vertexSet) {
                    nodeSetLayer.removeNodeSet(vertexSet);
                }, this);

                graph.on("updateVertexSet", function (sender, vertexSet) {
                    nodeSetLayer.updateNodeSet(vertexSet);
                }, this);

                graph.on("updateVertexSetCoordinate", function (sender, vertexSet) {

                }, this);


                graph.on("setData", function (sender, data) {

                }, this);


                graph.on("insertData", function (sender, data) {

                }, this);


                graph.on("clear", function (sender, event) {

                }, this);


                graph.on("startGenerate", function (sender, event) {
                    this._setProjection();
                }, this);
                graph.on("endGenerate", function (sender, event) {
                    /**
                     * Fired when all topology elements generated
                     * @event topologyGenerated
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    var layoutType = this.layoutType();
                    if (layoutType) {
                        this.activateLayout(layoutType, null, function () {
                            this.fire('topologyGenerated');
                        });
                    } else if (this.enableSmartLabel()) {
                        setTimeout(function () {
                            this.fire('topologyGenerated');
                        }.bind(this), 100);
                    } else {
                        this.fire('topologyGenerated');
                    }

                    this.hideLoading();

                }, this);


            },
            /**
             * Set data to topology, recommend use topo.data(data)
             * @method setData
             * @param data {JSON} should be {nodes:[],links:[]}
             */
            setData: function (data) {
                this.data(data);
            },
            /**
             * Insert data to topology
             * @method insertData
             * @param data {JSON}  should be {nodes:[],links:[]}
             */
            insertData: function (data) {
                this.graph().insertData(data);
                /**
                 * Fired after insert data
                 * @event insertData
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire("insertData", data);
            },


            /**
             * Get topology data, recommend use topo.data()
             * @method getData
             * @returns {JSON}
             */
            getData: function () {
                return this.data();
            },


            _saveData: function () {
                var data = this.graph().getData();

                if (Object.prototype.toString.call(window.localStorage) === "[object Storage]") {
                    localStorage.setItem("topologyData", JSON.stringify(data));
                }

            },
            _loadLastData: function () {
                if (Object.prototype.toString.call(window.localStorage) === "[object Storage]") {
                    var data = JSON.parse(localStorage.getItem("topologyData"));
                    this.setData(data);
                }
            },
            start: function () {
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Topology base events
     * @class nx.graphic.Topology.Event
     * @module nx.graphic.Topology
     */
    nx.define('nx.graphic.Topology.Event', {
        events: ['clickStage', 'pressStage', 'dragStageStart', 'dragStage', 'dragStageEnd', 'up', 'down', 'left', 'right', 'esc', 'space', 'enter'],
        methods: {
            _mousewheel: function (sender, event) {
                if (this.scalable()) {
                    var step = 8000;
                    var data = event.wheelDelta;
                    this._zoomCenterPoint = {
                        x: event.offsetX,
                        y: event.offsetY
                    };

                    this._scale = Math.max(Math.min(this._maxScale, this.scale() + data / step), this._minScale);


                    if (!this.__zoomStart) {
                        this.__zooming = true;
                        this.__zoomStart = true;
                        this._gradualZoom();
                    }


                    if (this._zooomEventTimer) {
                        clearTimeout(this._zooomEventTimer);
                    }

                    this._zooomEventTimer = setTimeout(function () {
                        delete this.__zooming;
                        delete this.__zoomStart;
                        delete this._zoomCenterPoint;
                    }.bind(this), 100);

                }
                event.preventDefault();
                return false;
            },


            _contextmenu: function (sender, event) {
                event.preventDefault();
            },
            _clickStage: function (sender, event) {
                /**
                 * Fired when click the stage
                 * @event clickStage
                 * @param sender {Object}  Trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('clickStage', event);
            },
            _pressStage: function (sender, event) {
                /**
                 * Fired when mouse press stage, this is a capture event
                 * @event pressStage
                 * @param sender {Object}  Trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('pressStage', event);
            },
            _dragStageStart: function (sender, event) {
                /**
                 * Fired when start drag stage
                 * @event dragStageStart
                 * @param sender {Object}  Trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragStageStart', event);
            },
            _dragStage: function (sender, event) {
                /**
                 * Fired when dragging stage
                 * @event dragStage
                 * @param sender {Object}  Trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragStage', event);
            },
            _dragStageEnd: function (sender, event) {
                /**
                 * Fired when drag end stage
                 * @event dragStageEnd
                 * @param sender {Object}  Trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragStageEnd', event);
            },
            _key: function (sender, event) {
                var code = event.keyCode;
                switch (code) {
                    case 38:
                        /**
                         * Fired when press up arrow key
                         * @event up
                         * @param sender {Object}  Trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('up', event);
                        event.preventDefault();
                        break;
                    case 40:
                        /**
                         * Fired when press down arrow key
                         * @event down
                         * @param sender {Object}  Trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('down', event);
                        event.preventDefault();
                        break;
                    case 37:
                        /**
                         * Fired when press left arrow key
                         * @event left
                         * @param sender {Object}  Trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('left', event);
                        event.preventDefault();
                        break;
                    case 39:
                        /**
                         * Fired when press right arrow key
                         * @event right
                         * @param sender {Object}  Trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('right', event);
                        event.preventDefault();
                        break;
                    case 13:
                        /**
                         * Fired when press enter key
                         * @event enter
                         * @param sender {Object}  Trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('enter', event);
                        event.preventDefault();
                        break;
                    case 27:
                        /**
                         * Fired when press esc key
                         * @event esc
                         * @param sender {Object}  Trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('esc', event);
                        event.preventDefault();
                        break;
                    case 32:
                        /**
                         * Fired when press space key
                         * @event space
                         * @param sender {Object}  Trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('space', event);
                        event.preventDefault();
                        break;
                }


                return false;
            }

        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Node mixin class
     * @class nx.graphic.Topology.NodeMixin
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.NodeMixin", {
        events: [],
        properties: {
            /**
             * Node instance class name, support function
             * @property nodeInstanceClass
             */
            nodeInstanceClass: {
                value: 'nx.graphic.Topology.Node'
            },
            /**
             * NodeSet instance class name, support function
             * @property nodeSetInstanceClass
             */
            nodeSetInstanceClass: {
                value: 'nx.graphic.Topology.NodeSet'
            },
            /**
             * Set node's draggable
             * @property nodeDraggable
             */
            nodeDraggable: {
                value: true
            },
            /**
             * Enable smart label
             * @property enableSmartLabel
             */
            enableSmartLabel: {
                value: true
            },
            /**
             * Show or hide node's icon
             * @property showIcon
             */
            showIcon: {
                get: function () {
                    return this._showIcon !== undefined ? this._showIcon : false;
                },
                set: function (value) {
                    if (this._showIcon !== value) {
                        this._showIcon = value;


                        if (this.status() !== "initializing") {
                            this.eachNode(function (node) {
                                node.showIcon(value);
                            });
                        }


                        return true;
                    } else {
                        return false;
                    }
                }
            },
            /**
             * All node's config. key is node's property, support super binding
             * value could be a single string eg: color:'#f00'
             * value could be a an expression eg: label :'{model.id}'
             * value could be a function eg iconType : function (model,instance){ return  'router'}
             * value could be a normal binding expression eg : label :'{#label}'
             * @property {nodeConfig}
             */
            nodeConfig: {},
            /**
             * All nodeSet's config. key is node's property, support super binding
             * value could be a single string eg: color:'#f00'
             * value could be a an expression eg: label :'{model.id}'
             * value could be a function eg iconType : function (model,instance){ return  'router'}
             * value could be a normal binding expression eg : label :'{#label}'
             * @property {nodeSetConfig}
             */
            nodeSetConfig: {},
            /**
             * All selected nodes, could direct add/remove nodes to this collection
             * @property selectedNodes {nx.data.ObservableCollection}
             */
            selectedNodes: {
                value: function () {
                    return new nx.data.ObservableCollection();
                }
            }

        },
        methods: {
            initNode: function () {
                this.selectedNodes().on('change', function (sender, args) {
                    if (args.action == 'add') {
                        nx.each(args.items, function (node) {
                            node.selected(true);
                        });
                    } else if (args.action == 'remove') {
                        nx.each(args.items, function (node) {
                            node.selected(false);
                        });
                    } else if (args.action == "clear") {
                        nx.each(args.items, function (node) {
                            node.selected(false);
                        });
                    }
                });
            },
            /**
             * Get the bound of passing node's
             * @param inNodes {Array}
             * @param isNotIncludeLabel {Boolean}
             * @returns {Array}
             */

            getBoundByNodes: function (inNodes, isNotIncludeLabel) {

                if (inNodes.length === 0) {
                    return null;
                }

                var boundAry = [];

                var lastIndex = inNodes.length - 1;


                nx.each(inNodes, function (node) {
                    if (isNotIncludeLabel) {
                        boundAry.push(node.getIconBound());
                    } else {
                        boundAry.push(this.getInsideBound(node.getBound()));
                    }
                }, this);


                var bound = {
                    left: 0,
                    top: 0,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    maxX: 0,
                    maxY: 0
                };


                //
                boundAry.sort(function (a, b) {
                    return a.left - b.left;
                });

                bound.x = bound.left = boundAry[0].left;
                bound.maxX = boundAry[lastIndex].left;

                boundAry.sort(function (a, b) {
                    return (a.left + a.width) - (b.left + b.width);
                });

                bound.width = boundAry[lastIndex].left + boundAry[lastIndex].width - bound.x;


                //
                boundAry.sort(function (a, b) {
                    return a.top - b.top;
                });

                bound.y = bound.top = boundAry[0].top;
                bound.maxY = boundAry[lastIndex].top;

                boundAry.sort(function (a, b) {
                    return (a.top + a.height) - (b.top + b.height);
                });

                bound.height = boundAry[lastIndex].top + boundAry[lastIndex].height - bound.y;

                return bound;


            },

            /**
             * Add a node to topology
             * @method addNode
             * @param obj
             * @param inOption
             * @returns {*}
             */
            addNode: function (obj, inOption) {
                var vertex = this.graph().addVertex(obj, inOption);
                this.adjustLayout();
                this.fire("addNode", this.getNode(vertex.id()));
                return this.getNode(vertex.id());
            },
            /**
             * Add a nodeSet
             * @method addNodeSet
             * @param obj
             * @param inOption
             * @returns {*}
             */
            addNodeSet: function (obj, inOption) {
                var vertex = this.graph().addVertexSet(obj, inOption);
                this.adjustLayout();
                this.fire("addNodeSet", this.getNode(vertex.id()));
                return this.getNode(vertex.id());
            },
            aggregationNodes: function (inNodes, inName) {

                var vertexSet = {nodes: []};

                nx.each(inNodes, function (node) {
                    vertexSet.nodes.push(node.id());
                });

                vertexSet.label = inName;
                if (!inName) {
                    vertexSet.label = [inNodes[0].label(), inNodes[inNodes.length - 1].label()].sort().join("-");
                }

                vertexSet.x = inNodes[0].model().x();
                vertexSet.y = inNodes[0].model().y();


                this.addNodeSet(vertexSet);
            },
            /**
             * Remove a node
             * @method removeNode
             * @param inNode
             * @returns {boolean}
             */
            removeNode: function (inNode) {
                var vertex;
                if (inNode instanceof  nx.graphic.Topology.Node) {
                    vertex = inNode.model();
                } else if (inNode instanceof  nx.data.Vertex) {
                    vertex = inNode;
                } else {
                    vertex = this.graph().getVertex(inNode);
                }
                if (vertex) {
                    this.graph().removeVertex(vertex);
                    this.adjustLayout();
                    this.fire("removeNode");
                    return true;
                } else {
                    return false;
                }
            },
            /**
             * Traverse each node
             * @method eachNode
             * @param fn
             * @param context
             */
            eachNode: function (fn, context) {
                this.getLayer("nodes").eachNode(fn, context || this);
                this.getLayer("nodeSet").eachNodeSet(fn, context || this);
            },
            /**
             * Get node by node id
             * @method getNode
             * @param id
             * @returns {*}
             */
            getNode: function (id) {
                return this.getLayer("nodes").getNode(id) || this.getLayer("nodeSet").getNodeSet(id);
            },
            /**
             * Get all visible nodes
             * @returns {Array}
             */
            getNodes: function () {
                return this.getLayer("nodes").nodes();
            },
            /**
             * Register a customize icon
             * @param name {String}
             * @param url {URL}
             * @param width {Number}
             * @param height {Number}
             */
            registerIcon: function (name, url, width, height) {
                var XLINK = 'http://www.w3.org/1999/xlink';
                var NS = "http://www.w3.org/2000/svg";
                var icon1 = document.createElementNS(NS, "image");
                icon1.setAttributeNS(XLINK, 'href', url);
                nx.graphic.Icons.icons[name] = {
                    size: {
                        width: width,
                        height: height
                    },
                    icon: icon1.cloneNode(true),
                    name: name
                };

                var icon = icon1.cloneNode(true);
                icon.setAttribute("height", height);
                icon.setAttribute("width", width);
                icon.setAttribute("data-device-type", name);
                icon.setAttribute("id", name);
                icon.setAttribute("class", 'deviceIcon');
                this.stage().addDef(icon);
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Links mixin class
     * @class nx.graphic.Topology.LinkMixin
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.LinkMixin", {
        events: ['addLink'],
        properties: {
            /**
             * Is topology support Multiple link , is false will highly improve performance
             * @property supportMultipleLink {Boolean}
             */
            supportMultipleLink: {
                value: true
            },
            /**
             * All link's config. key is link's property, support super binding
             * value could be a single string eg: color:'#f00'
             * value could be a an expression eg: label :'{model.id}'
             * value could be a function eg iconType : function (model,instance){ return  'router'}
             * value could be a normal binding expression eg : label :'{#label}'
             * @property {linkConfig}
             */
            linkConfig: {

            },
            /**
             * All linkSet's config. key is link's property, support super binding
             * value could be a single string eg: color:'#f00'
             * value could be a an expression eg: label :'{model.id}'
             * value could be a function eg iconType : function (model,instance){ return  'router'}
             * value could be a normal binding expression eg : label :'{#label}'
             * @property {linkSetConfig}
             */
            linkSetConfig: {

            }
        },
        methods: {

            /**
             * Add a link to topology
             * @method addLink
             * @param obj {JSON}
             * @param inOption {Config}
             * @returns {nx.graphic.Topology.Link}
             */
            addLink: function (obj, inOption) {
                var edge = this.graph().addEdge(obj, inOption);
                var link = this.getLink(edge.id());
                this.fire("addLink", link);
                return link;
            },
            /**
             * Remove a link
             * @method removeLink
             * @param inLink  {nx.graphic.Topology.Link}
             * @returns {boolean}
             */
            removeLink: function (inLink) {
                var edge;
                if (inLink instanceof  nx.graphic.Topology.Link) {
                    edge = inLink.model();
                } else if (inLink instanceof nx.data.Edge) {
                    edge = inLink;
                } else {
                    edge = this.graph().getEdge(inLink);
                }
                if (edge) {
                    this.graph().removeEdge(edge);
                    this.fire("removeLink");
                    return true;
                } else {
                    return false;
                }
            },
            /**
             * Traverse each link
             * @method eachLink
             * @param fn <Function>
             * @param context {Object}
             */
            eachLink: function (fn, context) {
                this.getLayer("links").eachLink(fn, context || this);
            },

            /**
             * Get link by link id
             * @method getLink
             * @param id
             * @returns {*}
             */
            getLink: function (id) {
                return this.getLayer("links").getLink(id);
            },
            /**
             * get linkSet by node
             * @param sourceVertexID {String} source node's id
             * @param targetVertexID {String} target node's id
             * @returns  {nx.graphic.Topology.LinkSet}
             */
            getLinkSet: function (sourceVertexID, targetVertexID) {
                return this.getLayer("linkSet").getLinkSet(sourceVertexID, targetVertexID);
            },
            /**
             * Get linkSet by linkKey
             * @param linkKey {String} linkKey
             * @returns {nx.graphic.Topology.LinkSet}
             */
            getLinkSetByLinkKey: function (linkKey) {
                return this.getLayer("linkSet").getLinkSetByLinkKey(linkKey);
            },
            /**
             * Get links by node
             * @param sourceVertexID {String} source node's id
             * @param targetVertexID {String} target node's id
             * @returns {Array} links collection
             */
            getLinksByNode: function (sourceVertexID, targetVertexID) {
                var linkSet = this.getLinkSet(sourceVertexID, targetVertexID);
                if (linkSet) {
                    return linkSet.getLinks();
                }
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {
    nx.define("nx.graphic.Topology.LayerMixin", {
        events: [],
        properties: {
            /**
             * @property layersMap
             */
            layersMap: {
                value: {}
            },
            /**
             * @property layers
             */
            layers: {
                value: function () {
                    return [];
                }
            }
        },
        methods: {
            init: function () {
                this.layersMap({});
                this.layers([]);
            },
            initLayer: function () {
                this.attachLayer("groups", "nx.graphic.Topology.GroupsLayer");
//                this.attachLayer("aggregationLayer", "nx.graphic.Topology.AggregationLayer");
                this.attachLayer("links", "nx.graphic.Topology.LinksLayer");
                this.attachLayer("linkSet", "nx.graphic.Topology.LinkSetLayer");
                this.attachLayer("nodes", "nx.graphic.Topology.NodesLayer");
                this.attachLayer("paths", "nx.graphic.Topology.PathLayer");
                this.attachLayer("nodeSet", "nx.graphic.Topology.NodeSetLayer");

            },
            /**
             * To generate a layer
             * @param name
             * @param layer
             * @returns {*}
             * @private
             */
            _generateLayer: function (name, layer) {
                var layerObj;
                if (name && layer) {
                    if (nx.is(layer, "String")) {
                        var cls = nx.path(global, layer);
                        if (cls) {
                            layerObj = new cls();
                        }
                    } else {
                        layerObj = layer;
                    }
                    layerObj.topology(this);
                    layerObj.model(this.graph());
                    layerObj.draw();

                    nx.each(layerObj.__events__, function (eventName) {
                        nx.Object.delegateEvent(layerObj, eventName, this, eventName);
                    }, this);
                }
                return layerObj;
            },
            /**
             * Get a layer reference by name
             * @method getLayer
             * @param name {String} The name you pass to topology when you attacherLayer/prependLayer/insertLayerAfter
             * @returns {*} Instance of a layer
             */
            getLayer: function (name) {
                var layersMap = this.layersMap();
                return layersMap[name];
            },
            appendLayer: function (name, layer) {
                return this.attachLayer(name, layer);
            },
            /**
             * attach a layer to topology, that should be subclass of nx.graphic.Topology.Layer
             * @method attachLayer
             * @param name {String} handler to get this layer
             * @param layer <String,nx.graphic.Topology.Layer> Could be string of a layer's class name, or a reference of a layer
             */
            attachLayer: function (name, layer) {
                var layersMap = this.layersMap();
                var layers = this.layers();
                var layerObj = this._generateLayer(name, layer);
                if (layerObj) {
                    layerObj.attach(this.stage());
                    layersMap[name] = layerObj;
                    layers.push(layerObj);
                }
                return layerObj;
            },
            /**
             * Prepend a layer to topology, that should be subclass of nx.graphic.Topology.Layer
             * @method prependLayer
             * @param name {String} handler to get this layer
             * @param layer <String,nx.graphic.Topology.Layer> Could be string of a layer's class name, or a reference of a layer
             */
            prependLayer: function (name, layer) {
                var layersMap = this.layersMap();
                var layers = this.layers();
                var layerObj = this._generateLayer(name, layer);
                if (layerObj) {
                    layerObj.attach(this.stage(), 0);
                    layersMap[name] = layerObj;
                    layers.unshift(layerObj);
                }
            },
            /**
             * Insert a layer under a certain layer, that should be subclass of nx.graphic.Topology.Layer
             * @method insertLayerAfter
             * @param name  {String} handler to get this layer
             * @param layer <String,Object> Could be string of a layer's class name, or a reference of a layer
             * @param upsideLayerName {String} name of upside layer
             */
            insertLayerAfter: function (name, layer, upsideLayerName) {
                var layersMap = this.layersMap();
                var layers = this.layers();
                var layerObj = this._generateLayer(name, layer);
                var afterLayer = layersMap[upsideLayerName];
                if (layerObj && afterLayer) {
                    var index = layers.indexOf(afterLayer);
                    layerObj.attach(this.stage(), index);
                    layersMap[name] = layerObj;
                    layers.splice(index + 1, 0, layerObj);
                }
            },
            /**
             * Call all layer's recover
             * @method recover
             * @param force
             */
            recover: function (force) {
                nx.each(this.layers(), function (layer) {
                    layer.recover(force);
                }, this);
            },
            /**
             * Clear all layer's content
             * @method clear
             */
            clear: function () {
                nx.each(this.layers(), function (layer) {
                    layer.clear();
                });
            },
            dispose: function () {
                nx.each(this.layers(), function (layer) {
                    layer.dispose();
                });
                this.inherited();
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Topology stage class
     * @class nx.graphic.Topology.StageMixin
     * @module nx.graphic.Topology
     */
    nx.define('nx.graphic.Topology.StageMixin', {
        events: ['ready', 'resizeStage'],
        properties: {
            /**
             * Set/get topology's width.
             * @property width {Number}
             */
            width: {
                value: 0
            },
            /**
             * height Set/get topology's height.
             * @property height {Number}
             */
            height: {
                value: 0
            },
            /**
             * Set/get stage's padding.
             * @property padding {Number}
             */
            padding: {
                get: function () {
                    return this._padding !== undefined ? this._padding : 100;
                },
                set: function (value) {
                    if (this._padding !== value) {
                        this._padding = value;
                        this.paddingLeft(value);
                        this.paddingTop(value);
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            paddingLeft: {
                value: 100
            },
            paddingTop: {
                value: 100
            },
            /**
             * Get the graphic container's width, include un visible area
             * @property containerWidth {Number}
             */
            containerWidth: {
                get: function () {
                    var w = this.scale() * (this.width() - this.paddingLeft() * 2);
                    return w < 30 ? 30 : w;
                }
            },
            /**
             * Get the graphic container's height, include un visible area
             * @property containerHeight {Number}
             */
            containerHeight: {
                get: function () {
                    var h = this.scale() * (this.height() - this.paddingTop() * 2);
                    return h < 30 ? 30 : h;
                }
            },
            /**
             * Get the graphic visible container's width
             * @property visibleContainerWidth {Number}
             */
            visibleContainerWidth: {
                get: function () {
                    var w = this.width() - this.paddingLeft() * 2;
                    return w < 30 ? 30 : w;
                }
            },
            /**
             * Get the graphic visible container's height
             * @property visibleContainerWidth {Number}
             */
            visibleContainerHeight: {
                get: function () {
                    var h = this.height() - this.paddingTop() * 2;
                    return h < 30 ? 30 : h;
                }
            },
            /**
             * Set to true will adapt to topology's outside container, set to ture will ignore width/height
             * @property adaptive {Boolean}
             */
            adaptive: {
                value: false
            },
            /**
             * Get the topology's stage component
             * @property stage {nx.graphic.Component}
             */
            stage: {
                get: function () {
                    return this.resolve('stage');
                }
            }
        },

        methods: {
            _adaptiveTimer: function () {
                var self = this;
                if (!this.adaptive() && (this.width() !== 0 && this.height() !== 0)) {
                    this.status('appended');
                    /**
                     * Fired when topology appended to container with with& height
                     * @event ready
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('ready');
                } else {
                    var timer = setInterval(function () {
                        if (nx.dom.Document.body().contains(self.resolve("@root"))) {
                            //
                            clearInterval(timer);
                            self._adaptToContainer();
                            self.status('appended');
                            self.fire('ready');
                        }
                    }, 10);
                }
            },
            _adaptToContainer: function () {
                var bound = this.resolve("@root").parentNode().getBound();
                if (bound.width === 0 || bound.height === 0) {
                    //nx.logger.log("Please set height*width to topology's parent container");
                }
                if (this._width !== bound.width || this._height !== bound.height) {
                    /**
                     * Fired when topology's stage changed
                     * @event resizeStage
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('resizeStage');
                    this.height(bound.height);
                    this.width(bound.width);
                }
            },
            /**
             * Make topology adapt to container,container should set width/height
             * @method adaptToContainer
             */
            adaptToContainer: function () {
                if (!this.adaptive()) {
                    return;
                }
                this._adaptToContainer();

                if (this._fitTimer) {
                    clearTimeout(this._fitTimer);
                }

                this._fitTimer = setTimeout(function () {
                    this.move(0.1);
                    this.fit();
                }.bind(this), 500);

            },
            /**
             * Get the passing bound's relative inside bound,if not passing param will return the topology graphic's bound
             * @param bound {JSON}
             * @returns {{left: number, top: number, width: number, height: number}}
             */
            getInsideBound: function (bound) {
                var _bound = bound || this.stage().view('stage').getBound();
                var topoBound = this.view().dom().getBound();

                return {
                    left: _bound.left - topoBound.left,
                    top: _bound.top - topoBound.top,
                    width: _bound.width,
                    height: _bound.height
                };
            },
            /**
             * Move topology to position
             * @method move
             * @param x {Number}
             * @param y {Number}
             * @param [duration] {Number} default is 0
             *
             */
            moveTo: function (x, y, duration) {
                var stage = this.stage();
                stage.setTransform(x, y, null, duration);
            },
            /**
             * Move topology
             * @method move
             * @param x {Number}
             * @param y {Number}
             * @param [duration] {Number} default is 0
             */
            move: function (x, y, duration) {
                var stage = this.stage();
                stage.setTransform(stage.translateX() + x || 0, stage.translateY() + y || 0, null, duration);
            },
            /**
             * Resize topology
             * @method resize
             * @param width {Number}
             * @param height {Number}
             */
            resize: function (width, height) {
                this.width(width);
                this.height(height);
                this.fire('resizeStage');
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, global) {

    /**
     * Tooltip mixin class
     * @class nx.graphic.Topology.TooltipMixin
     *
     */

    nx.define("nx.graphic.Topology.TooltipMixin", {
        events: [],
        properties: {
            /**
             * get tooltip manager
             * @property tooltipManager
             */
            tooltipManager: {
                value: function () {
                    return new nx.graphic.Topology.TooltipManager({topology: this});
                }
            },
            /**
             * Set/get the tooltip manager config
             * @property tooltipManagerConfig
             */
            tooltipManagerConfig: {
                get: function () {
                    return this._tooltipManagerConfig;
                },
                set: function (value) {
                    if (value) {
                        var tooltipManager = this.tooltipManager();
                        nx.each(value, function (value, prop) {
                            tooltipManager.set(prop, value);
                        });
                    }
                    this._tooltipManagerConfig = value;
                }
            }
        },
        methods: {

        }
    });


})(nx, nx.global);
(function (nx, util, global) {
    /**
     * Scene mixin
     * @class nx.graphic.Topology.SceneMixin
     * @module nx.graphic.Topology
     *
     */
    nx.define("nx.graphic.Topology.SceneMixin", {
        events: [],
        properties: {
            /**
             * @property scenesMap
             */
            scenesMap: {
                value: function () {
                    return {};
                }
            },
            /**
             * @property scenes
             */
            scenes: {
                value: function () {
                    return [];
                }
            },
            /**
             * Current scene name
             * @property currentSceneName
             */
            currentSceneName: {}
        },
        methods: {
            initScene: function () {
                this.registerScene("default", "nx.graphic.Topology.DefaultScene");
                this.registerScene("selection", "nx.graphic.Topology.SelectionNodeScene");
                this.registerScene("zoomBySelection", "nx.graphic.Topology.ZoomBySelection");
                this.activateScene('default');

            },
            /**
             * Register a scene to topology
             * @method registerScene
             * @param name {String} for reference to a certain scene
             * @param inClass <String,Class> A scene class name or a scene class instance, which is subclass of nx.graphic.Topology.Scene
             */
            registerScene: function (name, inClass) {
                var cls;
                if (name && inClass) {
                    var scene;
                    var scenesMap = this.scenesMap();
                    var scenes = this.scenes();
                    if (!nx.is(inClass, 'String')) {
                        scene = inClass;
                    } else {
                        cls = nx.path(global, inClass);
                        if (cls) {
                            scene = new cls();
                        } else {
                            //nx.logger.log('wrong scene name');
                        }
                    }
                    if (scene) {
                        scene.topology(this);
                        scenesMap[name] = scene;
                        scenes.push(scene);
                    }
                }
            },
            /**
             * Activate a scene, topology only has one active scene.
             * @method activateScene
             * @param name {String} Scene name which be passed at registerScene
             */
            activateScene: function (name) {
                var scenesMap = this.scenesMap();
                var sceneName = name || 'default';
                var scene = scenesMap[sceneName] || scenesMap["default"];
                //
                this.deactivateScene();
                this.currentScene = scene;
                this.currentSceneName(sceneName);

                scene.activate();
                this.fire("switchScene", {
                    name: name,
                    scene: scene
                });
                return scene;
            },
            /**
             * Deactivate a certain scene
             * @method deactivateScene
             */
            deactivateScene: function () {
                if (this.currentScene && this.currentScene.deactivate) {
                    this.currentScene.deactivate();

                }
                this.currentScene = null;
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Layout mixin class
     * @class nx.graphic.Topology.LayoutMixin
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.LayoutMixin", {
        events: [],
        properties: {
            /**
             * Layout map
             * @property  layoutMap
             */
            layoutMap: {
                value: function () {
                    return {};
                }
            },
            /**
             * Current layout type
             * @property layoutType
             */
            layoutType: {
                value: null
            },
            /**
             * Current layout config
             * @property layoutConfig
             */
            layoutConfig: {
                value: null
            }
        },
        methods: {
            initLayout: function () {
                this.registerLayout('force', new nx.graphic.Topology.NeXtForceLayout());
                this.registerLayout('USMap', new nx.graphic.Topology.USMapLayout());
                this.registerLayout('WorldMap', new nx.graphic.Topology.WorldMapLayout());
            },
            /**
             * Register a layout
             * @method registerLayout
             * @param name {String} layout name
             * @param cls {Object} layout class instance
             */
            registerLayout: function (name, cls) {
                var layoutMap = this.layoutMap();
                layoutMap[name] = cls;

                if (cls.topology) {
                    cls.topology(this);
                }
            },
            /**
             * Get layout instance by name
             * @method getLayout
             * @param name {String}
             * @returns {*}
             */
            getLayout: function (name) {
                var layoutMap = this.layoutMap();
                return layoutMap[name];
            },
            /**
             * Activate a layout
             * @param inName {String} layout name
             * @param inConfig {Object} layout config object
             * @param callback {Function} callback for after apply a layout
             */
            activateLayout: function (inName, inConfig, callback) {
                var layoutMap = this.layoutMap();
                var name = inName || this.layoutType();
                var config = inConfig || this.layoutConfig();
                if (layoutMap[name] && layoutMap[name].process) {
                    layoutMap[name].process(this.graph(), config, callback);
                    this.layoutType(name);
                }
            },
            deactivateLayout: function (name) {

            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Topology's batch operation class
     * @class nx.graphic.Topology.Categories
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.Categories", {
        events: [],
        properties: {
        },
        methods: {
            /**
             * Show loading indicator
             * @method showLoading
             */
            showLoading: function () {
                this.view().dom().addClass('n-topology-loading');
                this.view('loading').dom().setStyle('display', 'block');
            },
            /**
             * Hide loading indicator
             * @method hideLoading
             */
            hideLoading: function () {
                this.view().dom().removeClass('n-topology-loading');
                this.view('loading').dom().setStyle('display', 'none');
            },
            __draw: function () {
                var start = new Date();
                var serializer = new XMLSerializer();
                var svg = serializer.serializeToString(this.stage().resolve("@root").$dom.querySelector('.stage'));
                var defs = serializer.serializeToString(this.stage().resolve("@root").$dom.querySelector('defs'));
                var svgString = '<svg width="' + this.width() + '" height="' + this.height() + '" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" >' + defs + svg + "</svg>";
                var b64 = window.btoa(svgString);
                var img = this.resolve("img").resolve("@root").$dom;
                //var canvas = this.resolve("canvas").resolve("@root").$dom;
                img.setAttribute('width', this.width());
                img.setAttribute('height', this.height());
                img.setAttribute('src', 'data:image/svg+xml;base64,' + b64);
//                var ctx = canvas.getContext("2d");
//                ctx.drawImage(img, 10, 10);
                this.resolve("stage").resolve("@root").setStyle("display", "none");
                console.log('Generate image', new Date() - start);
            },
            __drawBG: function (inBound) {
                var bound = inBound || this.stage().getContentBound();
                var bg = this.stage().resolve('bg').root();
                bg.sets({
                    x: bound.left,
                    y: bound.top,
                    width: bound.width,
                    height: bound.height,
                    visible: true
                });
                this.stage().resolve('bg').set('visible', true);
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Topology base class

     var topologyData = {
        nodes: [
            {"id": 0, "x": 410, "y": 100, "name": "12K-1"},
            {"id": 1, "x": 410, "y": 280, "name": "12K-2"},
            {"id": 2, "x": 660, "y": 280, "name": "Of-9k-03"},
            {"id": 3, "x": 660, "y": 100, "name": "Of-9k-02"},
            {"id": 4, "x": 180, "y": 190, "name": "Of-9k-01"}
        ],
        links: [
            {"source": 0, "target": 1},
            {"source": 1, "target": 2},
            {"source": 1, "target": 3},
            {"source": 4, "target": 1},
            {"source": 2, "target": 3},
            {"source": 2, "target": 0},
            {"source": 3, "target": 0},
            {"source": 3, "target": 0},
            {"source": 3, "target": 0},
            {"source": 0, "target": 4},
            {"source": 0, "target": 4},
            {"source": 0, "target": 3}
        ]
     };
     nx.define('MyTopology', nx.ui.Component, {
        view: {
            content: {
                type: 'nx.graphic.Topology',
                props: {
                    width: 800,
                    height: 800,
                    nodeConfig: {
                        label: 'model.id'
                    },
                    showIcon: true,
                    data: topologyData
                }
            }
        }
     });
     var app = new nx.ui.Application();
     var comp = new MyTopology();
     comp.attach(app);


     * @class nx.graphic.Topology
     * @extend nx.ui.Component
     * @module nx.graphic.Topology
     * @uses nx.graphic.Topology.Config
     * @uses nx.graphic.Topology.Projection
     * @uses nx.graphic.Topology.Graph
     * @uses nx.graphic.Topology.Event
     * @uses nx.graphic.Topology.StageMixin
     * @uses nx.graphic.Topology.NodeMixin
     * @uses nx.graphic.Topology.LinkMixin
     * @uses nx.graphic.Topology.LayerMixin
     * @uses nx.graphic.Topology.TooltipMixin
     * @uses nx.graphic.Topology.SceneMixin
     *
     */
    nx.define("nx.graphic.Topology", nx.ui.Component, {
        mixins: [
            nx.graphic.Topology.Config,
            nx.graphic.Topology.Projection,
            nx.graphic.Topology.Graph,
            nx.graphic.Topology.Event,
            nx.graphic.Topology.StageMixin,
            nx.graphic.Topology.NodeMixin,
            nx.graphic.Topology.LinkMixin,
            nx.graphic.Topology.LayerMixin,
            nx.graphic.Topology.LayoutMixin,
            nx.graphic.Topology.TooltipMixin,
            nx.graphic.Topology.SceneMixin,
            nx.graphic.Topology.Categories
        ],
        view: {
            props: {
                'class': ['n-topology', '{#themeClass}'],
                tabindex: '0',
                style: {
                    width: "{#width}",
                    height: "{#height}"
                }
            },
            content: [
                {
                    name: 'nav',
                    type: 'nx.graphic.Topology.Nav',
                    props: {
                        visible: '{#showNavigation}',
                        showIcon: '{#showIcon,direction=<>}'
                    }
                },
                {
                    name: "stage",
                    type: "nx.graphic.TopologyStage",
                    props: {
                        width: "{#width}",
                        height: "{#height}",
                        translateX: '{#paddingLeft}',
                        translateY: '{#paddingTop}'
                    },
                    events: {
                        ':mousedown': '{#_pressStage}',
                        ':touchstart': '{#_pressStage}',
                        'mouseup': '{#_clickStage}',
                        'touchend': '{#_clickStage}',
                        'mousewheel': '{#_mousewheel}',
                        'touchmove': '{#_mousewheel}',
                        'dragStageStart': '{#_dragStageStart}',
                        'dragStage': '{#_dragStage}',
                        'dragStageEnd': '{#_dragStageEnd}'

                    }
                },
                {
                    name: 'loading',
                    props: {
                        'class': 'n-topology-loading'
                    },
                    content: {
                        tag: 'ul',
                        props: {
                            items: new Array(10),
                            template: {
                                tag: 'li'
                            }
                        }
                    }
                },
                {
                    name: 'img',
                    tag: 'img'
                },
                {
                    name: 'canvas',
                    tag: 'canvas'
                }

            ],
            events: {
                'contextmenu': '{#_contextmenu}',
                'keydown': '{#_key}'
            }
        },
        properties: {
        },
        methods: {
            init: function (args) {
                this.inherited(args);
                this.sets(args);

                this.initLayer();
                this.initGraph();
                this.initNode();
                this.initScene();
                this.initLayout();
            },
            attach: function (args) {
                this.inherited(args);
                this._adaptiveTimer();
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Topology basic layer class
     * @class nx.graphic.Topology.Layer
     * @extend nx.graphic.Group
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.Layer", nx.graphic.Group, {
        view: {
            type: 'nx.graphic.Group',
            content: [
                {
                    name: 'active',
                    type: 'nx.graphic.Group'
                },
                {
                    name: 'static',
                    type: 'nx.graphic.Group'

                }
            ]
        },
        properties: {
            /**
             * Get topology
             * @property topology
             */
            topology: {
                value: null
            },
            /**
             * Layer's highlight element's collection
             * @property highlightElements
             */
            highlightElements: {
                value: function () {
                    return [];
                }
            },
            fade: {
                value: false
            }
        },
        methods: {
            init: function (args) {
                this.inherited(args);
                this.resolve("@root").set("data-nx-type", this.__className__);
            },
            /**
             * Factory function, draw group
             */
            draw: function () {

            },
            /**
             * Show layer
             * @method show
             */
            show: function () {
                this.visible(true);
            },
            /**
             * Hide layer
             * @method hide
             */
            hide: function () {
                this.visible(false);
            },
            /**
             * fade out layer
             * @method fadeOut
             * @param [force] {Boolean} force layer fade out and can't fade in
             * @param [fn] {Function} callback after fade out
             * @param [context] {Object} callback context
             */
            fadeOut: function (force, fn, context) {
                var el = this.resolve('static');
                var _force = force !== undefined;
                if (this._fade) {
                    return;
                }
                if (fn) {
                    el.upon('transitionend', function callback() {
                        fn.call(context || this);
                        el.upon('transitionend', null, this);
                    }, this);
                }
                el.setStyle('opacity', 0.2, 0.5);

                this._fade = _force;
            },
            /**
             * Fade in layer
             * @method fadeIn
             * @param [fn] {Function} callback after fade out
             * @param [context] {Object} callback context
             */
            fadeIn: function (fn, context) {
                var el = this.resolve('static') || this.resolve('@root');
                if (fn) {
                    el.upon('transitionend', function () {
                        fn.call(context || this);
                        el.upon('transitionend', null, this);
                    }, this);
                }
                el.setStyle('opacity', 1, 0.5);
            },
            /**
             * Move a element to 'active' group for highlight this element

             layer.highlightElement(this.view('node1'));
             layer.fadeout();

             * @method highlightElement
             * @param el {nx.graphic.Component} element for highlight
             */
            highlightElement: function (el) {
                var highlightElements = this.highlightElements();
                var activeEl = this.resolve('active');

                highlightElements.push(el);
                el.append(activeEl);
                this.resolve('static').upon('transitionend', null, this);
            },
            /**
             * Recover layer's fade statues
             * @param force {Boolean} force recover all items
             */
            recover: function (force) {
                var staticEl = this.resolve('static');
                if (this._fade && !force) {
                    return;
                }
                this.fadeIn(function () {
                    nx.each(this.highlightElements(), function (el) {
                        el.append(staticEl);
                    }, this);
                    this.highlightElements([]);
                }, this);
                delete this._fade;
            },
            /**
             * clear layer's content
             * @method clear
             */
            clear: function () {
                if (this._resources && this._resources.static) {
                    this.$('active').empty();
                    this.$('static').empty();
                    this.$('static').setStyle('opacity', 1);
                } else {
                    this.resolve("@root").empty();
                }
                this.highlightElements([]);
            },
            dispose: function () {
                this.clear();
                //this.inherited();
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {

    var Vector = nx.math.Vector;
    /**
     * Abstract node class
     * @class nx.graphic.Topology.AbstractNode
     * @extend nx.graphic.Group
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.AbstractNode", nx.graphic.Group, {
        events: ['updateNodeCoordinate', 'selectNode'],
        properties: {
            /**
             * Get  node's absolute position
             * @property  position
             */
            position: {
                get: function () {
                    return {
                        x: this._x || 0,
                        y: this._y || 0
                    };
                },
                set: function (obj) {
                    var isModified = false;
                    var model = this.model();
                    if (obj.x != null) {
                        if (!this._lockXAxle && this._x !== obj.x) {
                            this._x = obj.x;
                            model.set("x", this.projectionX().invert(obj.x));
                            this.notify("x");
                            isModified = true;
                        }
                    }

                    if (obj.y != null) {
                        if (!this._lockYAxle && this._y !== obj.y) {
                            this._y = obj.y;
                            model.set("y", this.projectionY().invert(obj.y));
                            this.notify("y");
                            isModified = true;
                        }
                    }

                    if (isModified) {
                        this.notify('position');
                        this.notify('vector');
                        this.update();
                    }
                    return isModified;

                }
            },
            /**
             * Get/set  node's x position, suggest use position
             * @property  x
             */
            x: {
                get: function () {
                    return this._x || 0;
                },
                set: function (value) {
                    return this.position({x: value});
                },
                binding: {
                    direction: "<>",
                    converter: nx.Binding.converters.number
                }
            },
            /**
             * Get/set  node's y position, suggest use position
             * @property  y
             */
            y: {
                get: function () {
                    return this._y || 0;
                },
                set: function (value) {
                    return this.position({y: value});
                },
                binding: {
                    direction: "<>",
                    converter: nx.Binding.converters.number
                }
            },
            /**
             * Lock x axle, node only can move at y axle
             * @property lockXAxle {Boolean}
             */
            lockXAxle: {
                value: false
            },
            /**
             * Lock y axle, node only can move at x axle
             * @property lockYAxle
             */
            lockYAxle: {
                value: false
            },
            /**
             * Get topology instance
             * @property  topology
             */
            topology: {},
            /**
             * Get node's layer
             * @property nodesLayer
             */
            nodesLayer: {
                get: function () {
                    return this.owner();
                }
            },
            /**
             * Get topology's x scale object
             * @property projectionX
             */
            projectionX: {
                get: function () {
                    return this.topology().projectionX();
                }
            },
            /**
             * Get topology's y scale object
             * @property projectionY
             */
            projectionY: {
                get: function () {
                    return this.topology().projectionY();
                }
            },

            /**
             * Get topology's scale
             * @property scale
             */
            scale: {
                get: function () {
                    return this.topology().scale() || 1;
                }
            },
            /**
             * Get  node's vector
             * @property  vector
             */
            vector: {
                get: function () {
                    return new Vector(this.x(), this.y());
                }
            },
            /**
             * Get node's id
             * @property id
             */
            id: {
                get: function () {
                    return this.model().id();
                }
            },
            /**
             * Node is been selected statues
             * @property selected
             */
            selected: {
                value: false
            },
            /**
             * Get/set node's usablity
             * @property enable
             */
            enable: {
                value: true
            },
            /**
             * Get node self reference
             * @property node
             */
            node: {
                get: function () {
                    return this;
                }
            },
            fade: {
                value: false
            },
            fadeValue: {
                value: 0.5
            }
        },
        methods: {
            init: function (args) {
                this.inherited(args);
                this.watch('selected', function (prop, value) {
                    /**
                     * Fired when node been selected or cancel selected
                     * @event selectNode
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('selectNode', value);
                }, this);
            },
            /**
             * Factory function , will be call when set model
             */
            setModel: function (model) {
                var topo = this.topology();
                var projectionX = topo.projectionX();
                var projectionY = topo.projectionY();

                this.model(model);

                model.on('updateCoordinate', function (sender, position) {
                    this.position({
                        x: projectionX.get(position.x),
                        y: projectionY.get(position.y)
                    });
                    this.notify('position');
                    /**
                     * Fired when node update coordinate
                     * @event updateNodeCoordinate
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('updateNodeCoordinate');
                }, this);


                this.setBinding("visible", "model.visible");

                this.position({
                    x: projectionX.get(model.get("x")),
                    y: projectionY.get(model.get("y"))
                });


            },
            update: function () {

            },
            /**
             * Move node certain distance
             * @method move
             * @param x {Number}
             * @param y {Number}
             */
            move: function (x, y) {
                var position = this.position();
                this.position({x: position.x + x || 0, y: position.y + y || 0});
            },
            /**
             * Move to a position
             * @method moveTo
             * @param x {Number}
             * @param y {Number}
             * @param callback {Function}
             * @param isAnimation {Boolean}
             * @param duration {Number}
             */
            moveTo: function (x, y, callback, isAnimation, duration) {
                if (isAnimation !== false) {
                    var obj = {to: {}, duration: duration || 400};
                    obj.to.x = x;
                    obj.to.y = y;

                    if (callback) {
                        obj.complete = callback.bind(this);
                    }

                    this.animate(obj);
                } else {
                    this.position({x: x, y: y});
                }
            },
            /**
             * Use css to move node for high performance, when use this method, related link can't recive notification. Could hide links during transition.
             * @method cssMoveTo
             * @param x {Number}
             * @param y {Number}
             * @param callback {Function}
             */
            cssMoveTo: function (x, y, callback) {

            },
            /**
             * Fade out a node
             * @method fadeOut
             */
            fadeOut: function () {
                this.root().addClass('n-transition');
                this.resolve("@root").setStyle('opacity', this.fadeValue());
                this.fade(true);
            },
            /**
             * Fade in a node
             * @method fadeIn
             */
            fadeIn: function () {
                if (this.enable()) {
                    this.resolve("@root").setStyle('opacity', 1);
                    this.fade(false);
                }
            },
            /**
             * Get all links connect to this node
             * @returns {Array}
             * @method getLinks
             */
            getLinks: function () {
                return this.nodesLayer().getNodeConnectedLinks(this);
            },
            /**
             * Get Connected linkSet
             * @method getConnectedLinkSet
             * @returns {Array}
             */
            getConnectedLinkSet: function () {
                var model = this.model();
                var topo = this.topology();
                var selfID = model.id();
                var linkSetAry = [];
                model.eachConnectedVertices(function (vertex) {
                    var id = vertex.id();
                    var linkSet = topo.getLinkSet(selfID, id);
                    if (linkSet) {
                        linkSetAry.push(linkSet);
                    }
                }, this);

                return linkSetAry;

            },
            /**
             * Traverse all links connected to this node
             * @method eachLink
             * @param fn
             * @param context
             */
            eachLink: function (fn, context) {
                var model = this.model();
                var topo = this.topology();
                model.eachEdge(function (edge) {
                    var id = edge.get('id');
                    var link = topo.getLink(id);
                    if (link) {
                        fn.call(context || topo, link);
                    }
                }, this);
            },
            /**
             * Get all connected nodes
             * @method getConnectedNodes
             * @returns {Array}
             */
            getConnectedNodes: function () {
                var nodes = [];
                this.eachConnectedNodes(function (node) {
                    nodes.push(node);
                });
                return nodes;
            },
            /**
             * Iterate all connected nodes
             * @method eachConnectedNodes
             * @param fn {Function}
             * @param context {Object}
             */
            eachConnectedNodes: function (fn, context) {
                var model = this.model();
                var topo = this.topology();
                model.eachConnectedVertices(function (vertex) {
                    var id = vertex.id();
                    fn.call(context || this, topo.getNode(id), id);
                }, this);
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Node class
     * @class nx.graphic.Topology.Node
     * @extend nx.graphic.Topology.AbstractNode
     * @module nx.graphic.Topology
     */
    nx.define('nx.graphic.Topology.Node', nx.graphic.Topology.AbstractNode, {
        events: ['pressNode', 'clickNode', 'enterNode', 'leaveNode', 'dragNodeStart', 'dragNode', 'dragNodeEnd', 'selectNode'],
        properties: {
            /**
             * Get/set node's position
             * @property posotion
             */
            position: {
                get: function () {
                    return {
                        x: this._x || 0,
                        y: this._y || 0
                    };
                },
                set: function (obj) {
                    var isModified = false;
                    var model = this.model();
                    if (obj.x != null) {
                        if (!this._lockXAxle && this._x !== obj.x) {
                            if (this._x === undefined) {
                                this._x = obj.x;
                            } else {
                                this._x = obj.x;
                                model.set("x", this.projectionX().invert(obj.x));
                            }
                            this.notify("x");
                            isModified = true;
                        }
                    }

                    if (obj.y != null) {
                        if (!this._lockYAxle && this._y !== obj.y) {

                            if (this._y === undefined) {
                                this._y = obj.y;
                            } else {
                                this._y = obj.y;
                                model.set("y", this.projectionY().invert(obj.y));
                            }
                            this.notify("y");
                            isModified = true;
                        }
                    }

                    if (isModified) {
                        this.view().setTransform(this._x, this._y);
                        this.notify('vector');
                    }
                    return isModified;
                }
            },
            /**
             * Set node's scale
             * @property scale {Number}
             */
            scale: {
                set: function (value) {
                    this.view('graphic').setTransform(null, null, value);
                    this._nodeScale = value;
                }
            },
            /**
             * Set/get the radius of dot
             * @property radius {Number}
             */
            radius: {
                get: function () {
                    return this._radius !== undefined ? this._radius : 4;
                },
                set: function (value) {
                    if (this._radius !== value) {
                        this._radius = value;
                        this.view('dot').set('r', value);
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            /**
             * Node icon's type
             * @method iconType {String}
             */
            iconType: {
                value: 'unknown'
            },
            /**
             * Node's label font size
             * @property fontSize {Number}
             */
            fontSize: {
                value: 12
            },
            /**
             * Get node's label
             * @property label
             */
            label: {
                set: function (label) {
                    var el = this.resolve('label');
                    if (label !== undefined) {
                        el.set('text', label);
                        el.append();
                        this.calcLabelPosition();
                    } else {
                        el.remove();
                    }
                    this._label = label;
                }
            },
            /**
             * Set node's label visible
             */
            labelVisible: {
                set: function (value) {
                    var el = this.resolve('label');
                    el.visible(value);
                    this._labelVisible = value;
                }
            },
            /**
             * Show/hide node's icon
             * @property showIcon
             */
            showIcon: {
                set: function (value) {
                    var icon = this.resolve('iconContainer');
                    var dot = this.resolve('dot');
                    if (value) {
                        icon.set('iconType', this.iconType());
                        icon.append();
                        dot.remove();
                    } else {
                        icon.remove();
                        dot.append();
                    }

                    this._showIcon = value;
                    this.calcLabelPosition();
                    this._setSelectedRadius();
                }
            },

            /**
             * Get/set node's selected statues
             * @property selected
             */
            selected: {
                get: function () {
                    return this._selected || false;
                },
                set: function (value) {
                    if (this._selected != value) {
                        var el = this.resolve('selectedBG');
                        if (value) {
                            el.append();
                        } else {
                            el.remove();
                        }

                        this._selected = value;
                        this._setSelectedRadius();
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            /**
             * Set the dot's color
             * @property color
             */
            color: {
                set: function (value) {
                    this.$('graphic').setStyle('fill', value);
                    this.$('dot').setStyle('fill', value);
                    this.$('label').setStyle('fill', value);
                }
            },
            /**
             * Enable smart label feature
             * @property enableSmartLabel
             */
            enableSmartLabel: {
                value: true
            },
            enable: {
                get: function () {
                    return this._enable != null ? this._enable : true;
                },
                set: function (value) {
                    this._enable = value;
                    if (value) {
                        this.root().removeClass('disable');
                    } else {
                        this.root().addClass('disable');
                    }
                }
            }
        },
        view: {
            type: 'nx.graphic.Group',
            props: {
                'class': 'node'
            },
            content: [
                {
                    name: 'label',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'node-label',
                        'alignment-baseline': 'central',
                        x: 0,
                        y: 12,
                        'font-size': '{#fontSize}'
                    }
                },
                {
                    name: 'disableLabel',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'node-disable-label',
                        'alignment-baseline': 'central',
                        x: 12,
                        y: 12,
                        'font-size': '{#fontSize}'
                    }
                },
                {
                    name: 'selectedBG',
                    type: 'nx.graphic.Circle',
                    props: {
                        x: 0,
                        y: 0,
                        'class': 'selectedBG'
                    }
                },
                {
                    type: 'nx.graphic.Group',
                    name: 'graphic',
                    content: [

                        {
                            name: 'dot',
                            type: 'nx.graphic.Circle',
                            props: {
                                r: '4',
                                cx: 0,
                                cy: 0,
                                'class': 'dot'
                            }
                        },
                        {
                            name: 'iconContainer',
                            type: 'nx.graphic.Group',
                            content: [
                                {
                                    name: 'icon',
                                    type: 'nx.graphic.Icon',
                                    props: {
                                        'class': 'icon',
                                        iconType: '{#iconType}'
                                    }
                                }
                            ]
                        }
                    ],
                    events: {
                        'mousedown': '{#_mousedown}',
                        'mouseup': '{#_mouseup}',
                        'touchstart': '{#_mousedown}',
                        'touchend': '{#_mouseup}',

                        'mouseenter': '{#_mouseenter}',
                        'mouseleave': '{#_mouseleave}',

                        'dragstart': '{#_dragstart}',
                        'dragmove': '{#_drag}',
                        'dragend': '{#_dragend}'
                    }
                }


            ]
        },
        methods: {
            setModel: function (model) {
                this.inherited(model);
            },
            cssMoveTo: function (x, y, callback) {
                var el = this.view();
                el.upon('transitionend', function () {
                    this._x = x;
                    this._y = y;
                    this.notify('position');

                    this.model().set("position", {
                        x: this.projectionX().invert(x),
                        y: this.projectionY().invert(y)
                    });
                }, this);
                this.view().setTransform(x, y, null, 0.5);
            },
            _setSelectedRadius: function () {

                if (this.selected()) {
                    var radius;
                    var el = this.resolve('selectedBG');
                    if (this.showIcon()) {
                        var size = this.resolve('icon').size();
                        radius = Math.max(size.height, size.width) / 2;
                    } else {
                        radius = this.radius();
                    }
                    el.set('r', radius * 1.5 * (this._nodeScale || 1));
                }
            },
            _mousedown: function (sender, event) {
                if (this.enable()) {
                    this._prevPosition = this.position();
                    event.captureDrag(this.resolve('graphic'));
                    this.fire('pressNode', event);
                }
            },
            _mouseup: function (sender, event) {
                if (this.enable()) {
                    var _position = this.position();
                    if (this._prevPosition && _position.x === this._prevPosition.x && _position.y === this._prevPosition.y) {
                        /**
                         * Fired when click a node
                         * @event clickNode
                         * @param sender{Object} trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('clickNode', event);
                    }
                }
            },
            _mouseenter: function (sender, event) {
                if (this.enable()) {
                    if (!this.__enter) {
                        /**
                         * Fired when mouse enter a node
                         * @event enterNode
                         * @param sender{Object} trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('enterNode', event);
                        this.__enter = true;
                    }
                }


            },
            _mouseleave: function (sender, event) {
                if (this.enable()) {
                    if (this.__enter) {
                        /**
                         * Fired when mouse leave a node
                         * @event leaveNode
                         * @param sender{Object} trigger instance
                         * @param event {Object} original event object
                         */
                        this.fire('leaveNode', event);
                        this.__enter = false;
                    }
                }
            },
            _dragstart: function (sender, event) {
                if (this.enable()) {
                    /**
                     * Fired when start drag a node
                     * @event dragNodeStart
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('dragNodeStart', event);
                }
            },
            _drag: function (sender, event) {
                if (this.enable()) {
                    /**
                     * Fired when drag a node
                     * @event dragNode
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('dragNode', event);
                }
            },
            _dragend: function (sender, event) {
                if (this.enable()) {
                    /**
                     * Fired when finish a node
                     * @event dragNodeEnd
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('dragNodeEnd', event);
                    this._updateConnectedNodeLabelPosition();
                }
            },

            _updateConnectedNodeLabelPosition: function () {
                this.calcLabelPosition();
                this.eachConnectedNodes(function (node) {
                    node.calcLabelPosition();
                });
            },
            /**
             * Set label to a node
             * @method calcLabelPosition
             */
            calcLabelPosition: function () {
                if (this.enableSmartLabel()) {
                    if (this._centralizedTextTimer) {
                        clearTimeout(this._centralizedTextTimer);
                    }
                    this._centralizedTextTimer = setTimeout(function () {
                        this._centralizedText();
                        //this._setHintPosition();
                    }.bind(this), 100);
                } else {
                    this.updateByMaxObtuseAngle(90);
                }
            },
            _centralizedText: function () {


                //
                var vertex = this.model();

                if (vertex === undefined) {
                    return;
                }

                var vectors = [];

                // get all lines

                vertex.eachDirectedEdge(function (edge) {
                    vectors.push(edge.line().dir);
                });

                vertex.eachReverseEdge(function (edge) {
                    vectors.push(edge.line().dir.negate());
                });


                //sort line by angle;
                vectors = vectors.sort(function (a, b) {
                    return a.circumferentialAngle() - b.circumferentialAngle();
                });


                // get the min incline angle

                var startVector = new nx.math.Vector(1, 0);
                var maxAngle = 0, labelAngle;

                if (vectors.length === 0) {
                    labelAngle = 90;
                } else {
                    //add first item to vectors, for compare last item with first

                    vectors.push(vectors[0].rotate(359.9));

                    //find out the max incline angle
                    for (var i = 0; i < vectors.length - 1; i++) {
                        var inclinedAngle = vectors[i + 1].circumferentialAngle() - vectors[i].circumferentialAngle();
                        if (inclinedAngle < 0) {
                            inclinedAngle += 360;
                        }
                        if (inclinedAngle > maxAngle) {
                            maxAngle = inclinedAngle;
                            startVector = vectors[i];
                        }
                    }

                    // bisector angle
                    labelAngle = maxAngle / 2 + startVector.circumferentialAngle();

                    // if max that 360, reduce 360
                    labelAngle %= 360;
                }


                this._labelAngle = labelAngle;
                this.updateByMaxObtuseAngle(labelAngle);
            },
            /**
             * @method updateByMaxObtuseAngle
             * @method updateByMaxObtuseAngle
             * @param angle
             */
            updateByMaxObtuseAngle: function (angle) {

                var el = this.resolve('label');

                // find out the quadrant
                var quadrant = Math.floor(angle / 60);
                var anchor = 'middle';
                if (quadrant === 5 || quadrant === 0) {
                    anchor = 'start';
                } else if (quadrant === 2 || quadrant === 3) {
                    anchor = 'end';
                }

                //
                var size = this.getBound(true);
                var radius = Math.max(size.width / 2, size.height / 2) + (this.showIcon() ? 12 : 8);
                var labelVector = new nx.math.Vector(radius, 0).rotate(angle);


                el.set('x', labelVector.x);
                el.set('y', labelVector.y);
                //

                el.set('text-anchor', anchor);

            },
            /**
             * Get node bound
             * @param onlyGraphic {Boolean} is is TRUE, will only get graphic's bound
             * @returns {*}
             */
            getBound: function (onlyGraphic) {
                if (onlyGraphic) {
                    return this.resolve('graphic').getBound();
                } else {
                    return this.resolve('@root').getBound();
                }
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {


    /**
     * Nodes layer
     Could use topo.getLayer('nodes') get this
     * @class nx.graphic.Topology.NodesLayer
     * @extend nx.graphic.Topology.Layer
     *
     */
    nx.define('nx.graphic.Topology.NodesLayer', nx.graphic.Topology.Layer, {
        events: ['clickNode', 'enterNode', 'leaveNode', 'dragNodeStart', 'dragNode', 'dragNodeEnd', 'hideNode', 'pressNode', 'selectNode', 'updateNodeCoordinate'],
        properties: {
            /**
             * Get all nodes
             * @property nodes
             */
            nodes: {
                value: function () {
                    return [];
                }
            },
            /**
             * Get all node's map , id is key
             * @property nodesMap
             */
            nodesMap: {
                value: function () {
                    return {};
                }
            }
        },
        methods: {
            attach: function (args) {
                this.inherited(args);
                var topo = this.topology();
                topo.on('projectionChange', this._projectionChangeFN = function (sender, event) {
                    var projectionX = topo.projectionX();
                    var projectionY = topo.projectionY();
                    var nodes = this.nodes();
                    nx.each(nodes, function (node) {
                        var model = node.model();
                        node.position({
                            x: projectionX.get(model.get('x')),
                            y: projectionY.get(model.get('y'))
                        });
                    }, this);
                }, this);


                topo.watch('revisionScale', this._watchRevisionScale = function (prop, value) {
                    var nodes = this.nodes();
                    if (value == 1) {

                        nx.each(nodes, function (node) {
                            if (topo.showIcon()) {
                                node.showIcon(true);
                            } else {
                                node.radius(6);
                            }
                            node.view('label').set('visible', true);
                        });
                    } else if (value == 0.8) {
                        nx.each(nodes, function (node) {
                            node.showIcon(false);
                            node.radius(6);
                            node.view('label').set('visible', true);
                        });
                    } else if (value == 0.6) {
                        nx.each(nodes, function (node) {
                            node.showIcon(false);
                            node.radius(4);
                            node.view('label').set('visible', true);
                        });

                    } else if (value == 0.4) {
                        nx.each(nodes, function (node) {
                            node.showIcon(false);
                            node.radius(2);
                            node.view('label').set('visible', false);
                        });
                    }

                }, this);


            },
            /**
             * Add node a nodes layer
             * @param vertex
             * @method addNode
             */
            addNode: function (vertex) {
                var nodesMap = this.nodesMap();
                var nodes = this.nodes();
                var id = vertex.id();

                var node = this._generateNode(vertex);

                nodes.push(node);
                nodesMap[id] = node;
                node.attach(this.resolve('static'));
            },

            /**
             * Remove node
             * @method removeNode
             * @param vertex
             */
            removeNode: function (vertex) {
                var nodesMap = this.nodesMap();
                var nodes = this.nodes();
                var id = vertex.id();
                var node = nodesMap[id];

                node.dispose();
                nodes.splice(nodes.indexOf(node), 1);
                delete nodesMap[id];
            },
            updateNode: function (vertex) {

//                //todo
//                var nodesMap = this.nodesMap();
//
//                nodesMap[vertex.id()].visible(vertex.visible());
                //nodesMap[vertex.id()].fadeOut();
            },
            _generateNode: function (vertex) {
                var Clz;
                //get node class
                var topo = this.topology();
                var nodeInstanceClass = topo.nodeInstanceClass();
                if (nx.is(nodeInstanceClass, 'Function')) {
                    Clz = nodeInstanceClass.call(this, vertex);
                    if (nx.is(clz, 'String')) {
                        Clz = nx.path(global, Clz);
                    }
                } else {
                    Clz = nx.path(global, nodeInstanceClass);
                }

                var node = new Clz();
                node.set('topology', topo);
                node.setModel(vertex);

                node.set('class', 'node');
                node.resolve('@root').set('data-node-id', node.id());

                var defaultConfig = {
                };
                var nodeConfig = nx.extend(defaultConfig, topo.nodeConfig());
                nx.each(nodeConfig, function (value, key) {
                    util.setProperty(node, key, value, topo);
                }, this);
                util.setProperty(node, 'showIcon', topo.showIcon());
                util.setProperty(node, 'label', nodeConfig.label, topo);


                var superEvents = nx.graphic.Component.__events__;
                nx.each(node.__events__, function (e) {
                    if (superEvents.indexOf(e) == -1) {
                        node.on(e, function (sender, event) {
                            this.fire(e, node);
                        }, this);
                    }
                }, this);

                node.on('dragNode', function (sender, event) {
                    this._moveSelectionNodes(event, node);
                }, this);


                node.set('data-node-id', vertex.id());
                return node;
            },

            /**
             * Iterate all nodes
             * @method eachNode
             * @param fn
             * @param context
             */
            eachNode: function (fn, context) {
                nx.each(this.nodes(), fn, context || this);
            },
            /**
             * Get node by id
             * @param id
             * @returns {*}
             * @method getNode
             */
            getNode: function (id) {
                var nodesMap = this.nodesMap();
                return nodesMap[id];
            },
            /**
             * Get node's connected links
             * @method getNodeConnectedLinks
             * @param node
             * @returns {Array}
             */
            getNodeConnectedLinks: function (node) {
                var links = [];
                var model = node.model();
                var topo = this.topology();
                model.eachEdge(function (edge) {
                    var id = edge.id();
                    var link = topo.getLink(id);
                    links.push(link);
                }, this);
                return links;
            },
            /**
             * Get node connected linkSet
             * @property getNodeConnectedLinkSet
             * @param node
             * @returns {Array}
             */
            getNodeConnectedLinkSet: function (node) {
                var model = node.model();
                var topo = this.topology();
                var linkSetAry = [];

                model.eachEdgeSet(function (edgeSet) {
                    var linkSet = topo.getLinkSetByLinkKey(edgeSet.linkKey());
                    linkSetAry.push(linkSet);
                });
                return linkSetAry;

            },
            /**
             * HighLight node, after call this, should call fadeOut();
             * @method highlightNode
             * @param node
             */
            highlightNode: function (node) {
                this.highlightElement(node);
            },
            /**
             * Batch action, highlight node and related nodes and connected links.
             * @param node
             */
            highlightRelatedNode: function (node) {
                var topo = this.topology();

                this.highlightElement(node);

                node.eachConnectedNodes(function (n) {
                    this.highlightElement(n);
                }, this);


                if (topo.supportMultipleLink()) {
                    topo.getLayer('linkSet').highlightLinkSet(this.getNodeConnectedLinkSet(node));
                    topo.getLayer('linkSet').fadeOut();
                    topo.getLayer('links').fadeOut();
                } else {
                    topo.getLayer('links').highlightLinks(this.getNodeConnectedLinks(node));
                    topo.getLayer('links').fadeOut();
                }

                this.fadeOut();
            },
            _moveSelectionNodes: function (event, node) {
                var topo = this.topology();
                if (topo.nodeDraggable()) {
                    var nodes = topo.selectedNodes().toArray();
                    if (nodes.indexOf(node) === -1) {
                        node.move(event.drag.delta[0], event.drag.delta[1]);
                    } else {
                        nx.each(nodes, function (node) {
                            node.move(event.drag.delta[0], event.drag.delta[1]);
                        });
                    }
                }
            },
            /**
             * Rest
             */
            resetPosition: function () {
                var nodes = this.nodes();
                nx.each(nodes, function (node) {
                    var model = node.model();
                    node.moveTo(projectionX.get(model.get('x')), projectionY.get(model.get('y')));
                }, this);
            },
            clear: function () {
                nx.each(this.nodes(), function (node) {
                    node.dispose();
                });

                this.nodes([]);
                this.nodesMap({});
                this.inherited();
            },
            dispose: function () {
                topo.off('projectionChange', this._projectionChangeFN, this);
                topo.unwatch('revisionScale', this._watchRevisionScale, this);
                this.inherited();
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * NodeSet class
     * @class nx.graphic.Topology.NodeSet
     * @extend nx.graphic.Topology.Node
     * @module nx.graphic.Topology
     */

    nx.define("nx.graphic.Topology.NodeSet", nx.graphic.Topology.Node, {
        events: ['expandNode', 'collapseNode'],
        properties: {
            /**
             * Get all sub nodes
             */
            nodes: {
                value: function () {
                    return [];
                }
            },
            links: {
                value: function () {
                    return [];
                }
            },
            showIcon: {
                set: function (value) {
                    var icon = this.resolve('iconContainer');
                    var dot = this.resolve('dot');
                    if (value) {
                        icon.set('iconType', this.iconType());
                        icon.append();
                    } else {
                        icon.remove();
                    }

                    this._showIcon = value;
                    this.calcLabelPosition();
                }
            },
            color: {
                set: function (value) {
                    this.$('dot').setStyle('stroke', value);
                    this.$('line1').setStyle('fill', value);
                    this.$('line2').setStyle('fill', value);
                    this.$('label').setStyle('fill', value);
                }
            },
            /**
             * Collapsed statues
             * @property collapsed
             */
            collapsed: {
                get: function () {
                    return this._collapsed !== undefined ? this._collapsed : null;
                },
                set: function (value) {
                    if (this._collapsed !== value) {
                        this._collapsed = value;
                        if (value) {
                            this._collapse();
                        } else {
                            this._expand();
                        }
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        view: {
            type: 'nx.graphic.Group',
            props: {
                translate: '{#position}',
                'class': 'node nodeset'
            },
            content: [
                {
                    name: 'label',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'node-label',
                        'alignment-baseline': 'central',
                        x: 0,
                        y: 12,
                        'font-size': '{#fontSize}'
                    }
                },
                {
                    name: 'disableLabel',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'node-disable-label',
                        'alignment-baseline': 'central',
                        x: 12,
                        y: 12,
                        'font-size': '{#fontSize}'
                    }
                },
                {
                    name: 'selectedBG',
                    type: 'nx.graphic.Circle',
                    props: {
                        x: 0,
                        y: 0,
                        'class': 'selectedBG'
                    }
                },
                {
                    type: 'nx.graphic.Group',
                    name: 'graphic',
                    props: {
                        scale: '{#scale}'
                    },
                    content: [
                        {
                            name: 'iconContainer',
                            type: 'nx.graphic.Group',
                            content: [
                                {
                                    name: 'icon',
                                    type: 'nx.graphic.Icon',
                                    props: {
                                        'class': 'icon',
                                        iconType: '{#iconType}'
                                    }
                                }
                            ]
                        },
                        {
                            type: "nx.graphic.Group",
                            props: {
                                'class': 'icon'
                            },
                            content: [
                                {
                                    name: 'dot',
                                    type: 'nx.graphic.Circle',
                                    props: {
                                        r: '{#radius}',
                                        x: 0,
                                        y: 0,
                                        'class': 'dot'
                                    }
                                },
                                {
                                    name: 'line1',
                                    type: 'nx.graphic.Rect',
                                    props: {
                                        translateX: -3,
                                        translateY: -0.5,
                                        width: 6,
                                        height: 1,
                                        'class': 'bg'
                                    }
                                },
                                {
                                    name: 'line2',
                                    type: 'nx.graphic.Rect',
                                    props: {
                                        translateX: -0.5,
                                        translateY: -3,
                                        width: 1,
                                        height: 6,
                                        'class': 'bg'
                                    }
                                }
                            ]
                        }
                    ],
                    events: {
                        'mousedown': '{#_mousedown}',
                        'mouseup': '{#_mouseup}',
                        'touchstart': '{#_mousedown}',
                        'touchend': '{#_mouseup}',

                        'mouseenter': '{#_mouseenter}',
                        'mouseleave': '{#_mouseleave}',

                        'dragstart': '{#_dragstart}',
                        'dragmove': '{#_drag}',
                        'dragend': '{#_dragend}'
                    }
                }
            ]
        },
        methods: {
            setModel: function (model) {
                this.inherited(model);
                this._collapsed = model._activated;
                this.setBinding('collapsed', 'model.activated,direction=<>', this);
            },
            /**
             * Expand nodeSet
             * @method expand
             */
            expand: function () {
                this.collapsed(false);
            },
            /**
             * Collapse nodeSet
             * @method collapse
             */
            collapse: function () {
                this.collapsed(true);
            },
            _expand: function () {

                this._originalVerteicesPosition = {};

                var vertices = this.model().vertices();

                nx.each(vertices, function (vertex) {
                    var postion = this.model().position();
                    this._originalVerteicesPosition[vertex.id()] = vertex.position();
                    vertex.position(postion);
                }, this);


                this.remove();


                setTimeout(function () {
                    var topo = this.topology();
                    nx.each(this.getNodes(), function (node) {
                        var position = topo.getProjectedPosition(this._originalVerteicesPosition[node.id()]);
                        node.moveTo(position.x, position.y, null, true, 300);
                    }, this);

//                    setTimeout(topo.fit.bind(topo), 1000);

                    this.fire('expandNode', this);

                }.bind(this), 0);
            },

            _collapse: function () {
                this.append();
                this.fire('collapseNode');
            },

            /**
             * Get all sub nodes
             * @returns {Array}
             */
            getNodes: function () {
                var vertices = this.model().vertices();
                var topo = this.topology();
                var nodes = [];

                nx.each(vertices, function (vertex) {
                    nodes.push(topo.getNode(vertex.id()));
                });

                return nodes;
            },
            getAllLeafNodes: function () {
                var vertices = this.model().vertices();
                var layer = this.owner();
                var nodes = [];

                nx.each(vertices, function (vertex) {
                    var node = layer.getNode(vertex.id());
                    if (node instanceof  nx.graphic.Topology.NodeSet) {
                        nodes = nodes.concat(node.getLeafNodes());
                    } else {
                        nodes.push(node);
                    }
                });
                return nodes;
            },
            getRootParentNodeSet: function () {
                var parentEdgeSet = this.model().getTopParentVertexSet();
                if (parentEdgeSet) {
                    return this.owner().getNode(parentEdgeSet.id());
                } else {
                    return null;
                }
            },
            getVisibleNodes: function () {
                var vertices = this.model().vertices();
                var layer = this.owner();
                var nodes = [];
                nx.each(vertices, function (vertex) {
                    var node = layer.getNode(vertex.id());
                    if (node instanceof  nx.graphic.Topology.NodeSet && !node.collapsed()) {
                        nodes = nodes.concat(node.getVisibleNodes());
                    } else {
                        nodes.push(node);
                    }
                });
                return nodes;
            },
            updateByMaxObtuseAngle: function (angle) {
                this.inherited(angle);
                if (this.showIcon()) {
                    var el = this.resolve("iconContainer");
                    var size = this.resolve("icon").size();
                    var radius = Math.max(size.width / 2, size.height / 2) + (this.showIcon() ? 12 : 8);
                    var labelVector = new nx.math.Vector(radius, 0).rotate(angle);
                    el.setTransform(labelVector.x, labelVector.y);
                    var labelEL = this.resolve("label");

                    radius = (radius - 10) * 2 + 12;
                    labelVector = new nx.math.Vector(radius, 0).rotate(angle);
                    labelEL.sets({
                        x: labelVector.x,
                        y: labelVector.y
                    });
                }
            }
        }

    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {
    nx.define('nx.graphic.Topology.NodeSetLayer', nx.graphic.Topology.Layer, {
        events: ['clickNodeSet', 'enterNodeSet', 'leaveNodeSet', 'dragNodeSetStart', 'dragNodeSet', 'dragNodeSetEnd', 'hideNodeSet', 'pressNodeSet', 'selectNodeSet', 'updateNodeSetCoordinate', 'expandNodeSet', 'collapseNodeSet'],
        properties: {
            nodeSet: {
                value: function () {
                    return [];
                }
            },
            nodeSetMap: {
                value: function () {
                    return {};
                }
            }
        },
        methods: {
            attach: function () {
                this.attach.__super__.apply(this, arguments);
                var topo = this.topology();
                topo.on('projectionChange', this._projectionChangeFN = function (sender, event) {
                    var projectionX = topo.projectionX();
                    var projectionY = topo.projectionY();
                    var nodeSet = this.nodeSet();
                    nx.each(nodeSet, function (nodeset) {
                        var model = nodeset.model();
                        nodeset.position({
                            x: projectionX.get(model.get('x')),
                            y: projectionY.get(model.get('y'))
                        });
                    }, this);
                }, this);
            },
            draw: function () {

            },
            addNodeSet: function (vertexSet) {
                var nodeSetMap = this.nodeSetMap();
                var nodeSet = this.nodeSet();
                var id = vertexSet.id();

                var nodeset = this._generateNodeSet(vertexSet);

                nodeSet.push(nodeset);
                nodeSetMap[id] = nodeset;
                nodeset.attach(this.resolve('static'));
            },


            removeNodeSet: function (vertexSet) {
                var nodeSetMap = this.nodeSetMap();
                var nodeSet = this.nodeSet();
                var id = vertexSet.id();
                var nodeset = nodeSetMap[id];

                nodeset.dispose();
                nodeSet.splice(nodeSet.indexOf(nodeset), 1);
                delete nodeSetMap[id];
            },
            updateNodeSet: function (nodeSetMap) {

//                //todo
//                var nodesMap = this.nodesMap();
//
//                nodesMap[vertex.id()].visible(vertex.visible());
                //nodesMap[vertex.id()].fadeOut();
            },
            _generateNodeSet: function (vertexSet) {
                var Clz;
                //get node class
                var topo = this.topology();
                var nodeSetInstanceClass = topo.nodeSetInstanceClass();
                if (nx.is(nodeSetInstanceClass, 'Function')) {
                    Clz = nodeSetInstanceClass.call(this, vertexSet);
                    if (nx.is(Clz, 'String')) {
                        Clz = nx.path(global, Clz);
                    }
                } else {
                    Clz = nx.path(global, nodeSetInstanceClass);
                }

                var nodeset = new Clz();
                nodeset.set('topology', topo);
                nodeset.setModel(vertexSet);

                nodeset.set('class', 'node');
                nodeset.resolve('@root').set('data-node-id', nodeset.id());

                var defaultConfig = {
                    showIcon: false
                };
                var nodeSetConfig = nx.extend(defaultConfig, topo.nodeSetConfig());
                nx.each(nodeSetConfig, function (value, key) {
                    util.setProperty(nodeset, key, value, topo);
                }, this);
                util.setProperty(nodeset, 'showIcon', nodeSetConfig.showIcon == null ? topo.showIcon() : nodeSetConfig.showIcon, topo);
                util.setProperty(nodeset, 'label', nodeSetConfig.label, topo);


                var superEvents = nx.graphic.Component.__events__;
                nx.each(nodeset.__events__, function (e) {
                    if (superEvents.indexOf(e) == -1) {
                        nodeset.on(e, function (sender, event) {
                            this.fire(e.replace('Node', 'NodeSet'), nodeset);
                        }, this);
                    }
                }, this);


                nodeset.on('dragNode', function (sender, event) {
                    this._moveSelectionNodes(event, nodeset);
                }, this);

                nodeset.set('data-node-id', vertexSet.id());
                return nodeset;
            },

            /**
             * Iterate all nodeSet
             * @method eachNode
             * @param fn
             * @param context
             */
            eachNodeSet: function (fn, context) {
                nx.each(this.nodeSet(), fn, context || this);
            },
            /**
             * Get node by id
             * @param id
             * @returns {*}
             * @method getNode
             */
            getNodeSet: function (id) {
                var nodeSetMap = this.nodeSetMap();
                return nodeSetMap[id];
            },
            getNodeConnectedLinks: function (nodeset) {
                var links = [];
                var model = nodeset.model();
                var topo = this.topology();
                model.eachEdge(function (edge) {
                    var id = edge.id();
                    var link = topo.getLink(id);
                    links.push(link);
                }, this);
                return links;
            },
            getNodeConnectedLinkSet: function (nodeset) {
                var model = nodeset.model();
                var topo = this.topology();
                var linkSetAry = [];

                model.eachEdgeSet(function (edgeSet) {
                    var linkSet = topo.getLinkSetByLinkKey(edgeSet.linkKey());
                    linkSetAry.push(linkSet);
                }, this);
                return linkSetAry;
            },
            highlightNode: function (nodeset) {
                this.highlightElement(nodeset);
            },
            highlightRelatedNode: function (nodeset) {
                var topo = this.topology();

                this.highlightElement(nodeset);

                node.eachConnectedNodes(function (n) {
                    this.highlightElement(n);
                }, this);


                if (topo.supportMultipleLink()) {
                    topo.getLayer('linkSet').highlightLinkSet(this.getNodeConnectedLinkSet(nodeset));
                    topo.getLayer('linkSet').fadeOut();
                } else {
                    topo.getLayer('links').highlightLinks(this.getNodeConnectedLinks(nodeset));
                    topo.getLayer('links').fadeOut();
                }

                this.fadeOut();
            },
            /**
             * Recover all nodes status
             * @method recover
             */
            recover: function () {
                this.fadeIn(function () {
                    nx.each(this.highlightedNodeSet(), function (node) {
                        node.append(this.resolve('static'));
                    }, this);
                    this.highlightedNodeSet([]);
                }, this);
            },
            /**
             * Reset node's position, especially when reset projection, this will have transition
             * @method resetPosition
             */
            resetPosition: function () {
                var nodes = this.nodes();
                nx.each(nodes, function (node) {
                    var model = node.model();
                    node.moveTo(projectionX.get(model.get('x')), projectionY.get(model.get('y')));
                }, this);
            },
            clear: function () {
                //this.topology().off('projectionChange', this._projectionChangeFN, this);
                nx.each(this.nodeSet(), function (nodeset) {
                    nodeset.dispose();
                });

                this.nodeSet([]);
                this.nodeSetMap({});
                this.inherited();
            },
            _moveSelectionNodes: function (event, node) {
                var topo = this.topology();
                var nodes = topo.selectedNodes().toArray();
                if (nodes.indexOf(node) === -1) {
                    nodes.push(node);
                }

                nx.each(nodes, function (node) {
                    node.move(event.drag.delta[0], event.drag.delta[1]);
                });
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {
    var Vector = nx.math.Vector;
    var Line = nx.math.Line;

    /**
     * Abstract link class
     * @class nx.graphic.Topology.AbstractLink
     * @extend nx.graphic.Group
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.AbstractLink", nx.graphic.Group, {
        events: ["hide", "show"],
        properties: {
            /**
             * Get source node's instance
             * @property  sourceNode
             */
            sourceNode: {
                get: function () {
                    var topo = this.topology();
                    var id = this.model().source().id();
                    return topo.getNode(id);
                }
            },
            /**
             * Get target node's instance
             * @property targetNode
             */
            targetNode: {
                get: function () {
                    var topo = this.topology();
                    var id = this.model().target().id();
                    return topo.getNode(id);
                }
            },
            /**
             * Get source node's position
             * @property sourcePosition
             */
            sourcePosition: {
                get: function () {
                    return this.sourceNode().position();
                }
            },
            /**
             * Get target node's position
             * @property targetPosition
             */
            targetPosition: {
                get: function () {
                    return this.targetNode().position();
                }
            },
            /**
             * Get source node's id
             * @property sourceNodeID
             */
            sourceNodeID: {
                get: function () {
                    return this.model().source().id();
                }
            },
            /**
             * Get target node's id
             * @property targetNodeID
             */
            targetNodeID: {
                get: function () {
                    return this.model().target().id();
                }
            },
            /**
             * Get source node's x position
             * @property sourceX
             */
            sourceX: {
                get: function () {
                    return this.sourceNode().x();
                }
            },
            /**
             * Get source node's y position
             * @property sourceY
             */
            sourceY: {
                get: function () {
                    return this.sourceNode().y();
                }
            },
            /**
             * Get target node's x position
             * @property targetX
             */
            targetX: {
                get: function () {
                    return this.targetNode().x();
                }
            },
            /**
             * Get target node's x position
             * @property targetY
             */
            targetY: {
                get: function () {
                    return this.targetNode().y();
                }
            },
            /**
             * Get source node's vector
             * @property sourceVector
             */
            sourceVector: {
                get: function () {
                    return this.sourceNode().vector();
                }
            },
            /**
             * Get target node's vector
             * @property targetVector
             */
            targetVector: {
                get: function () {
                    return this.targetNode().vector();
                }
            },
            position: {
                get: function () {
                    var sourceNode = this.sourceNode().position();
                    var targetNode = this.targetNode().position();
                    return {
                        x1: sourceNode.x || 0,
                        x2: sourceNode.y || 0,
                        y1: targetNode.x || 0,
                        y2: targetNode.y || 0
                    };
                }
            },
            /**
             * Get link's line object
             * @property line
             */
            line: {
                get: function () {
                    return  new Line(this.sourceVector(), this.targetVector());
                }
            },
            /**
             * Get topology instance
             * @property topology
             */
            topology: {
                value: null
            },
            /**
             * Get topology's x scale object
             * @property projectionX
             */
            projectionX: {
                get: function () {
                    return this.topology().projectionX();
                }
            },
            /**
             * Get topology's y scale object
             * @property projectionY
             */
            projectionY: {
                get: function () {
                    return this.topology().projectionY();
                }
            },
            /**
             * Get topology's scale
             * @property scale
             */
            scale: {
                get: function () {
                    return this.topology().scale() || 1;
                }
            },
            /**
             * Get link's id
             * @property id
             */
            id: {
                get: function () {
                    return this.model().id();
                }
            },
            /**
             * Get link's linkKey
             * @property linkKey
             */
            linkKey: {
                get: function () {
                    return this.model().linkKey();
                }
            },
            /**
             * Get is link is reverse link
             * @property reverse
             */
            reverse: {
                get: function () {
                    return this.model().reverse();
                }
            },
            /**
             * Get this center point's position
             * @property centerPoint
             */
            centerPoint: {
                get: function () {
                    return this.line().center();
                }
            },
            /**
             * Get/set link's usability
             * @property enable
             */
            enable: {
                value: true
            },
            fade: {
                value: false
            }

        },
        methods: {
            /**
             * Factory function , will be call when set model
             * @method setModel
             */
            setModel: function (model, isUpdate) {
                //
                this.model(model);
                //
                model.source().watch("position", this._watchS = function (prop, value) {
                    this.notify("sourcePosition");
                    this.update();
                }, this);

                model.target().watch("position", this._watchT = function () {
                    this.notify("targetPosition");
                    this.update();
                }, this);

                //bind model's visible with element's visible
                this.setBinding("visible", "model.visible,direction=<>", this);

                if (isUpdate !== false) {
                    this.update();
                }
            },


            /**
             * Factory function , will be call when relate data updated
             * @method update
             */
            update: function () {
                this.notify('centerPoint');
                this.notify('line');
                this.notify('position');
                this.notify('targetVector');
                this.notify('sourceVector');
            },
            /**
             * Fade out a node
             * @method fadeOut
             */
            fadeOut: function () {
                this.root().setStyle('opacity', this.fadeValue());
                this.fade(true);
            },
            /**
             * Fade in a link
             * @method fadeIn
             */
            fadeIn: function () {
                if (this.enable()) {
                    var sourceNode = this.sourceNode();
                    var targetNode = this.targetNode();

                    if (!sourceNode.enable() || !targetNode.enable() || sourceNode.fade() || targetNode.fade()) {
                        this.fadeOut();
                    } else {
                        this.root().setStyle('opacity', 1);
                        this.fade(false);
                    }
                } else {
                    this.fadeOut();
                }
            },
            dispose: function () {
                var model = this.model();
                if (model) {
                    model.source().unwatch("position", this._watchS, this);
                    model.target().unwatch("position", this._watchT, this);
                }
                this.inherited();
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {
    var Vector = nx.math.Vector;
    var Line = nx.math.Line;
    /**
     * Link class
     * @class nx.graphic.Topology.Link
     * @extend nx.graphic.Topology.AbstractLink
     * @module nx.graphic.Topology
     */

    var gutterStep = 5;

    nx.define('nx.graphic.Topology.Link', nx.graphic.Topology.AbstractLink, {
        events: ['pressLink', 'clickLink', 'enterLink', 'leaveLink'],
        properties: {
            /**
             * Get link type 'curve' / 'parallel'
             * @property linkType {String}
             */
            linkType: {
                value: 'curve'
            },
            /**
             * Get/set link's gutter percentage
             * @property gutter {Float}
             */
            gutter: {
                value: 0
            },
            /**
             * Get/set link's gutter step
             * @property gutterStep {Number}
             */
            gutterStep: {
                value: 5
            },
            /**
             * Get/set link's label, it is shown at the center point
             * @property label {String}
             */
            label: {
                set: function (label) {
                    var el = this.resolve("label");
                    /*jshint -W083*/
                    if (label != null) {
                        el.append();
                    } else {
                        el.remove();
                    }
                    this._label = label;
                }
            },
            /**
             * Get/set link's source point label
             * @property sourceLabel {String}
             */
            sourceLabel: {
                set: function (label) {
                    var el = this.resolve("sourceLabel");
                    if (label != null) {
                        el.append();
                    } else {
                        el.remove();
                    }
                    this._sourceLabel = label;
                }
            },
            /**
             * Get/set link's target point label
             * @property targetLabel {String}
             */
            targetLabel: {
                set: function (label) {
                    var el = this.resolve("targetLabel");
                    if (label != null) {
                        el.append();
                    } else {
                        el.remove();
                    }
                    this._targetLabel = label;
                }
            },
            /**
             * Set/get link's color
             * @property color {Color}
             */
            color: {
                set: function (value) {
                    this.$('line').setStyle('stroke', value);
                    this.$('path').setStyle('stroke', value);
                    this._color = value;
                }
            },
            /**
             * Set/get link's width
             * @property width {Number}
             */
            width: {
                set: function (value) {
                    this.$('line').setStyle('stroke-width', value);
                    this.$('path').setStyle('stroke-width', value);
                    this._color = value;
                }
            },
            /**
             * Set/get is link dotted
             * @property dotted {Boolean}
             */
            dotted: {
                set: function (value) {
                    if (value) {
                        this.$('path').setStyle('stroke-dasharray', '2, 5');
                    } else {
                        this.$('path').setStyle('stroke-dasharray', '');
                    }
                    this._dotted = value;
                }
            },
            /**
             * Set link's style
             * @property style {Object}
             */
            style: {
                set: function (value) {
                    this.$('line').setStyles(value);
                    this.$('path').setStyles(value);
                }
            },
            fade: {
                value: false
            },
            /**
             * Get link's parent linkSet
             * @property parentLinkSet
             */
            parentLinkSet: {

            },
            /**
             * Get link's source interface point position
             * @property sourcePoint
             */
            sourcePoint: {
                get: function () {
                    var line = this.getPaddingLine();
                    return line.start;
                }
            },
            /**
             * Get link's target interface point position
             * @property targetPoint
             */
            targetPoint: {
                get: function () {
                    var line = this.getPaddingLine();
                    return line.end;
                }
            },
            /**
             * Set/get link's usability
             * @property enable {Boolean}
             */
            enable: {
                get: function () {
                    return this._enable != null ? this._enable : true;
                },
                set: function (value) {
                    this._enable = value;
                    if (value) {
                        this.resolve("disableLabel").remove();

                    } else {
                        this.resolve('disableLabel').append();
                        this.root().addClass('disable');
                    }
                }
            },
            /**
             * Set the link's draw function, after set this property please call update function
             * @property drawMethod {Function}
             */
            drawMethod: {

            }

        },
        view: {
            type: 'nx.graphic.Group',
            props: {
                'class': 'link'
            },
            content: [
                {
                    type: 'nx.graphic.Group',
                    content: [
                        {
                            name: 'path',
                            type: 'nx.graphic.Path',
                            props: {
                                'class': 'link'
                            }
                        },
                        {
                            name: 'overPath',
                            type: 'nx.graphic.Path',
                            props: {
                                style: 'stroke:#f00'
                            }
                        },
                        {
                            name: 'line',
                            type: 'nx.graphic.Line',
                            props: {
                                'class': 'link'
                            }
                        }
                    ],
                    events: {
                        'mouseenter': '{#_mouseenter}',
                        'mouseleave': '{#_mouseleave}',
                        'mousedown': '{#_mousedown}',
                        'touchstart': '{#_mousedown}',
                        'mouseup': '{#_mouseup}',
                        'touchend': '{#_mouseup}'
                    }
                },
                {
                    name: 'label',
                    type: 'nx.graphic.Text',
                    props: {
                        'alignment-baseline': 'text-before-edge',
                        'text-anchor': 'middle',
                        'class': 'link-label'
                    }
                },
                {
                    name: 'sourceLabel',
                    type: 'nx.graphic.Text',
                    props: {
                        'alignment-baseline': 'text-before-edge',
                        'text-anchor': 'start',
                        'class': 'source-label'
                    }
                },
                {
                    name: 'targetLabel',
                    type: 'nx.graphic.Text',
                    props: {
                        'alignment-baseline': 'text-before-edge',
                        'text-anchor': 'end',
                        'class': 'target-label'
                    }
                },
                {
                    name: 'disableLabel',
                    type: 'nx.graphic.Text',
                    props: {
                        'alignment-baseline': 'central',
                        'text-anchor': 'middle',
                        'class': 'disable-label',
                        text: 'x'
                    }
                }
            ]
        },
        methods: {

            /**
             * Update link's path
             * @method update
             */
            update: function () {

                this.inherited();

                var _gutter = this.gutter() * this.gutterStep();
                var gutter = new Vector(0, _gutter);
                var line = this.line();
                var d;

                if (this.reverse()) {
                    line = line.negate();
                }
                if (this.drawMethod()) {
                    d = this.drawMethod().call(this, this.model(), this);
                    this.resolve('path').append();
                    this.resolve('line').remove();
                    this.resolve('path').set('d', d);

                } else if (this.linkType() == 'curve') {
                    var path = [];
                    var n, point;

                    _gutter = _gutter * 3;
                    n = line.normal().multiply(_gutter);
                    point = line.center().add(n);
                    path.push('M', line.start.x, line.start.y);
                    path.push('Q', point.x, point.y, line.end.x, line.end.y);
                    path.push('Q', point.x + 1, point.y + 1, line.start.x, line.start.y);
                    path.push('Z');
                    d = path.join(' ');
                    this.resolve('path').append();
                    this.resolve('line').remove();
                    this.resolve('path').set('d', d);
                } else {
                    var lineEl = this.resolve('line');
                    var newLine = line.translate(gutter);
                    lineEl.sets({
                        x1: newLine.start.x,
                        y1: newLine.start.y,
                        x2: newLine.end.x,
                        y2: newLine.end.y
                    });
                    this.resolve('path').remove();
                    this.resolve('line').append();
                }
                this._updateLabel();
                //  this._setHintPosition();
            },
            /**
             * Get link's padding Line
             * @method getPaddingLine
             * @returns {*}
             */
            getPaddingLine: function () {
                var _gutter = this.gutter() * gutterStep;
                var sourceSize = this.sourceNode().getBound(true);
                var sourceRadius = Math.max(sourceSize.width, sourceSize.height) / 1.3;
                var targetSize = this.targetNode().getBound(true);
                var targetRadius = Math.max(targetSize.width, targetSize.height) / 1.3;
                var line = this.line().pad(sourceRadius, targetRadius);
                var n = line.normal().multiply(_gutter);
                return line.translate(n);
            },
            /**
             * Get calculated gutter number
             * @method getGutter
             * @returns {number}
             */
            getGutter: function () {
                return this.gutter() * this.gutterStep();
            },
            _updateLabel: function () {
                var el, point;
                var _gutter = this.gutter() * gutterStep;
                var line = this.line();
                var n = line.normal().multiply(_gutter);
                if (this._label != null) {
                    el = this.resolve("label");
                    point = line.center().add(n);
                    el.set('x', point.x);
                    el.set('y', point.y);
                    el.set('text', this._label);
                }

                if (this._sourceLabel) {
                    el = this.resolve("sourceLabel");
                    point = this.sourcePoint();
                    el.set('x', point.x);
                    el.set('y', point.y);
                    el.set('text', this._sourceLabel);
                }


                if (this._targetLabel) {
                    el = this.resolve("targetLabel");
                    point = this.targetPoint();
                    el.set('x', point.x);
                    el.set('y', point.y);
                    el.set('text', this._targetLabel);
                }


                if (!this.enable()) {
                    el = this.resolve("disableLabel");
                    point = line.center().add(n);
                    el.set('x', point.x);
                    el.set('y', point.y);
                }

            },

            __drawOverPath: function () {
                var path = this.$("path").$dom;
                var overPath = this.$("overPath").$dom;
                var length = path.getTotalLength();
                var index = path.getPathSegAtLength(length * 0.5);
                var endPoint = path.getPointAtLength(length * 0.5);
                var segList = path.pathSegList;
                var pathAry = [];
                for (var i = 0; i <= index; i++) {
                    var item = segList.getItem(i);
                    pathAry.push(item.pathSegTypeAsLetter);
                    if (item.x1) {
                        pathAry.push(item.x1, item.y1);
                    }
                    pathAry.push(item.x, item.y);
                }
                pathAry.pop();
                pathAry.pop();
                pathAry.push(endPoint.x, endPoint.y);
                //pathAry.push("Z");

                overPath.setAttribute('d', pathAry.join(" "));

            },
            /**
             * Fade out link
             * @method fadeOut
             * @param force {Boolean}
             */
            fadeOut: function (force) {
                this.inherited(force);
                var parentLinkSet = this.parentLinkSet();
                if (parentLinkSet) {
                    parentLinkSet.fadeOut(force);
                }
            },
            /**
             * Recover link's fade status
             * @param force
             */
            recover: function (force) {
                this.selected(false);
                this.fadeIn(force);
            },
            _mousedown: function () {
                if (this.enable()) {
                    /**
                     * Fired when mouse down on link
                     * @event pressLink
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('pressLink');
                }
            },
            _mouseup: function () {
                if (this.enable()) {
                    /**
                     * Fired when click link
                     * @event clickLink
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('clickLink');
                }
            },
            _mouseleave: function () {
                if (this.enable()) {
                    /**
                     * Fired when mouse leave link
                     * @event leaveLink
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('leaveLink');
                }
            },
            _mouseenter: function () {
                if (this.enable()) {
                    /**
                     * Fired when mouse enter link
                     * @event enterLink
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('enterLink');
                }
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Links layer
     Could use topo.getLayer('linksLayer') get this
     * @class nx.graphic.Topology.LinksLayer
     * @extend nx.graphic.Topology.Layer
     */

    nx.define('nx.graphic.Topology.LinksLayer', nx.graphic.Topology.Layer, {
        events: ['pressLink', 'clickLink', 'enterLink', 'leaveLink'],
        properties: {
            /**
             * Links collection
             * @property links
             */
            links: {
                value: function () {
                    return [];
                }
            },
            /**
             * Links id : value map
             * @property linksMap
             */
            linksMap: {
                value: function () {
                    return {};
                }
            }
        },
        methods: {
            /**
             * Add a link
             * @param edge
             * @method addLink
             */

            addLink: function (edge) {
                var id = edge.id();
                var link = this._generateLink(edge);

                link.attach(this.resolve('static'));
                this.links().push(link);
                this.linksMap()[id] = link;
                return link;
            },
            /**
             * Update link
             * @method updateLink
             * @param edge {nx.data.edge}
             */
            updateLink: function (edge) {
                this.getLink(edge.id()).update();
            },
            /**
             * Remove a link
             * @param edge {nx.data.Edge}
             */
            removeLink: function (edge) {
                var linksMap = this.linksMap();
                var links = this.links();
                var id = edge.id();
                var link = linksMap[id];
                if (link) {
                    link.dispose();
                    links.splice(links.indexOf(link), 1);
                    delete linksMap[id];
                }
            },

            _generateLink: function (edge) {
                var id = edge.id();
                var topo = this.topology();

                var link = new nx.graphic.Topology.Link({
                    topology: topo
                });
                link.setModel(edge, false);
                link.resolve('@root').set('class', 'link');
                link.resolve('@root').set('data-link-id', id);
                link.resolve('@root').set('data-linkKey', edge.linkKey());
                link.resolve('@root').set('data-source-node-id', edge.source().id());
                link.resolve('@root').set('data-target-node-id', edge.target().id());

                var defaultConfig = {
                    linkType: 'parallel',
                    gutter: 0,
                    label: null,
                    sourceLabel: null,
                    targetLabel: null,
                    color: null,
                    width: null,
                    dotted: false,
                    style: null,
                    enable: true
                };

                var linkConfig = nx.extend(defaultConfig, topo.linkConfig());
                nx.each(linkConfig, function (value, key) {
                    util.setProperty(link, key, value, topo);
                }, this);
                link.update();


                var superEvents = nx.graphic.Component.__events__;
                nx.each(link.__events__, function (e) {
                    if (superEvents.indexOf(e) == -1) {
                        link.on(e, function (sender, event) {
                            this.fire(e, link);
                        }, this);
                    }
                }, this);

                link.set('class', 'link');
                link.set('data-link-id', id);
                link.set('data-source-node-id', edge.source().id());
                link.set('data-target-node-id', edge.target().id());


                return link;

            },


            /**
             * Traverse all links
             * @param fn
             * @param context
             * @method eachLink
             */
            eachLink: function (fn, context) {
                nx.each(this.linksMap(), fn, context || this);
            },
            /**
             * Get link by id
             * @param id
             * @returns {*}
             */
            getLink: function (id) {
                return this.linksMap()[id];
            },
            /**
             * Highlight links
             * @method highlightLinks
             * @param links {Array} links array
             */
            highlightLinks: function (links) {
                nx.each(links, function (link) {
                    this.highlightElement(link);
                }, this);
            },
            /**
             * Clear links layer
             * @method clear
             */
            clear: function () {
                nx.each(this.links(), function (link) {
                    link.dispose();
                });

                this.links([]);
                this.linksMap({});
                this.inherited();
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    var Vector = nx.math.Vector;
    var Line = nx.math.Line;

    /**
     * LinkSet class
     * @class nx.graphic.Topology.LinkSet
     * @extend nx.graphic.Topology.AbstractLink
     * @module nx.graphic.Topology
     */


    nx.define('nx.graphic.Topology.LinkSet', nx.graphic.Topology.AbstractLink, {
        events: ['pressLinkSetNumber', 'clickLinkSetNumber', 'enterLinkSetNumber', 'leaveLinkSetNumber', 'collapsedLinkSet', 'expandLinkSet'],
        properties: {
            /**
             * Get link type 'curve' / 'parallel'
             * @property linkType {String}
             */
            linkType: {
                value: 'curve'
            },
            /**
             * Sub links collection
             * @property links
             * @readOnly
             */
            links: {
                value: function () {
                    return [];
                }
            },
            /**
             * Is linkSet is auto collapes
             * @property autoCollapse
             */
            autoCollapse: {
                value: true
            },
            /**
             * LinkSet's color
             * @property color
             */
            color: {
                set: function (value) {
                    this.$('numBg').setStyle('fill', value);
                    this.$('path').setStyle('stroke', value);
                    this._color = value;
                }
            },
            /**
             * Collapsed statues
             * @property collapsed
             */
            collapsed: {
                get: function () {
                    return this._collapsed;
                },
                set: function (value) {
                    if (this._collapsed !== value) {
                        this._collapsed = value;
                        if (value) {
                            this._updateLinkNumber();
                            this.update();
                            /**
                             * Fired when collapse linkSet
                             * @event collapsedLinkSet
                             * @param sender{Object} trigger instance
                             * @param event {Object} original event object
                             */
                            this.fire('collapsedLinkSet');
                        } else {
                            this.remove();
                            setTimeout(function () {
                                this.getLinks();
                                this._updateLinksGutter();
                                /**
                                 * Fired when expend linkSet
                                 * @event expandLinkSet
                                 * @param sender{Object} trigger instance
                                 * @param event {Object} original event object
                                 */
                                this.fire('expandLinkSet');
                            }.bind(this), 0);
                        }
                        return true;
                    } else {
                        return false;
                    }

                }
            },
            /**
             * Set/get link's usability
             * @property enable {Boolean}
             */
            enable: {
                get: function () {
                    return this._enable === undefined ? true : this._enable;
                },
                set: function (value) {
                    this._enable = value;
                    this.eachLink(function (link) {
                        link.enable(value);
                    });
                }
            },
            fade: {
                value: false
            }
        },
        view: {
            type: 'nx.graphic.Group',
            props: {
                'data-type': 'links-sum',
                'class': 'link-set'
            },
            content: [
                {
                    name: 'path',
                    type: 'nx.graphic.Line',
                    props: {
                        'class': 'link-set-bg'
                    }
                },
                {
                    name: 'numBg',
                    type: 'nx.graphic.Rect',
                    props: {
                        'class': 'link-set-circle',
                        height: 1
                    },
                    events: {
                        'mousedown': '{#_number_mouseup}',
                        'mouseenter': '{#_number_mouseenter}',
                        'mouseleave': '{#_number_mouseleave}'
                    }
                },
                {
                    name: 'num',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'link-set-text'
                    }
                }
            ]
        },
        methods: {
            setModel: function (model, isUpdate) {
                this.inherited(model, isUpdate);
                //this._collapsed = model._activated;
                this.setBinding('collapsed', 'model.activated,direction=<>', this);
            },
            update: function () {
                if (this._collapsed) {
                    var lineEl = this.resolve('path');
                    var line = this.line();
                    lineEl.sets({
                        x1: line.start.x,
                        y1: line.start.y,
                        x2: line.end.x,
                        y2: line.end.y
                    });
                    this.append();
                    //num
                    var centerPoint = this.centerPoint();
                    this.$('num').set('x', centerPoint.x);
                    this.$('num').set('y', centerPoint.y);
                    this.$('numBg').set('x', centerPoint.x);
                    this.$('numBg').set('y', centerPoint.y);
                }
            },
            /**
             * Adjust sub links and collapse or expend linkset
             * @method adjust
             */
            adjust: function () {
                if (!this.autoCollapse()) {
                    this.expand();
                } else if (this.model().containEdgeSet()) {
                    this.collapse();
                } else {
                    var linkType = this.linkType();
                    var edges = this.model().getEdges(null, true);
                    var maxLinkNumber = linkType === 'curve' ? 9 : 5;
                    if (edges.length <= maxLinkNumber) {
                        this.expand();
                    } else {
                        this.collapse();
                    }

                }
            },
            /**
             * Update linkSet
             * @property updateLinkSet
             */
            updateLinkSet: function () {
                this.adjust();
                if (this._collapsed) {
                    this.update();
                    this._updateLinkNumber();
                } else {
                    //this.adjust();
                    this.getLinks();
                    this._updateLinksGutter();
                }
            },
            /**
             * Collapse linkSet
             * @method collapse
             */
            collapse: function () {
                this.collapsed(true);
            },
            /**
             * Expend linkSet
             * @method expand
             */
            expand: function () {
                this.collapsed(false);
            },
            /**
             * Iterate all sub links
             * @method eachLink
             * @param fn {Function}
             * @param context {Object}
             */
            eachLink: function (fn, context) {
                nx.each(this.links(), fn, context || this);
            },
            /**
             * Get all sub links
             * @method getLinks();
             * @returns {*}
             */
            getLinks: function () {
                var links = this.links();
                links.length = 0;
                var topo = this.topology();
                nx.each(this.model().getEdges(null, true), function (edge) {
                    var link = topo.getLink(edge.id());
                    if (link) {
                        links.push(link);
                    }
                });
                return links;
            },
            _updateLinkNumber: function () {
                var edges = this.model().getEdges(null, true);
                this.$('num').set('text', edges.length);

                var bound = this.resolve('num').getBound();
                var width = Math.max(bound.width - 6, 1);

                this.$('numBg').set('width', width);
                this.resolve('numBg').setTransform(width / -2);
            },
            _updateLinksGutter: function () {
                if (!this._collapsed) {
                    var links = this.links();
                    if (links.length > 1 && !this.model().containEdgeSet()) {
                        // reset all links gutter
                        if (links.length > 1) {
                            var offset = (links.length - 1) / 2;
                            nx.each(links, function (link, index) {
                                link.gutter(index * -1 + offset);
                                link.update();
                            });
                        }
                    }
                }
            },


            _number_mousedown: function (sender, event) {
                if (this.enable()) {
                    /**
                     * Fired when press number element
                     * @event pressLinkSetNumber
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('pressLinkSetNumber', event);
                }
            },
            _number_mouseup: function (sender, event) {
                if (this.enable()) {
                    /**
                     * Fired when click number element
                     * @event clickLinkSetNumber
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('clickLinkSetNumber', event);
                }
            },
            _number_mouseleave: function (sender, event) {
                if (this.enable()) {
                    /**
                     * Fired when mouse leave number element
                     * @event numberleave
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('numberleave', event);
                }
            },
            _number_mouseenter: function (sender, event) {
                if (this.enable()) {
                    /**
                     * Fired when mouse enter number element
                     * @event numberenter
                     * @param sender{Object} trigger instance
                     * @param event {Object} original event object
                     */
                    this.fire('numberenter', event);
                }
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /** Links layer
     Could use topo.getLayer('linksLayer') get this
     * @class nx.graphic.Topology.LinksLayer
     * @extend nx.graphic.Topology.Layer
     */

    nx.define('nx.graphic.Topology.LinkSetLayer', nx.graphic.Topology.Layer, {
        events: ['pressLinkSetNumber', 'clickLinkSetNumber', 'enterLinkSetNumber', 'leaveLinkSetNumber', 'collapsedLinkSet', 'expandLinkSet'],
        properties: {
            linkSetCollection: {
                value: function () {
                    return [];
                }
            },
            linkSetMap: {
                value: function () {
                    return {};
                }
            }
        },
        methods: {
            attach: function (args) {
                this.inherited(args);
                var topo = this.topology();
                topo.watch('revisionScale', this._watchRevisionScale = function (prop, value) {
                    var links = this.linkSetCollection();
                    nx.each(links, function (link) {
                        link.view('numBg').setStyle('stroke-width', value * 16);
                        link.view('num').setStyle('font-size', Math.round(value * 9 + 3));
                    });

                }, this);

            },
            addLinkSet: function (edgeSet) {
                var linkSetCollection = this.linkSetCollection();
                var linkSetMap = this.linkSetMap();
                var linkSet = this._generateLinkSet(edgeSet);

                linkSetMap[edgeSet.linkKey()] = linkSet;
                linkSetCollection.push(linkSet);

                return linkSet;
            },
            updateLinkSet: function (edgeSet) {
                var linkSet = this.getLinkSetByLinkKey([edgeSet.linkKey()]);
                linkSet.updateLinkSet();
            },
            removeLinkSet: function (edgeSet) {
                var linkSetCollection = this.linkSetCollection();
                var linkSetMap = this.linkSetMap();
                var linkKey = edgeSet.linkKey();
                var linkSet = linkSetMap[linkKey];
                if (linkSet) {
                    linkSet.model().removeAllEdges();
                    linkSet.dispose();
                    linkSetCollection.splice(linkSetCollection.indexOf(linkSet), 1);
                    delete linkSetMap[linkKey];
                    return true;
                } else {
                    return false;
                }
            },

            removeNode: function (vertex) {
            },

            _generateLinkSet: function (edgeSet) {
                var linkKey = edgeSet.linkKey();
                var topo = this.topology();
                var linkset = new nx.graphic.Topology.LinkSet({
                    topology: topo
                });

                var root = linkset.resolve('@root');
                root.set('data-nx-type', 'nx.graphic.Topology.LinkSet');
                root.set('data-linkKey', linkKey);
                root.set('data-source-node-id', edgeSet.source().id());
                root.set('data-target-node-id', edgeSet.target().id());

                linkset.attach(this.resolve('static'));
                linkset.setModel(edgeSet, false);


                var defaultConfig = {
                    linkType: 'parallel',
                    gutter: 0,
                    label: null,
                    sourceLabel: null,
                    targetLabel: null,
                    color: null,
                    width: null,
                    dotted: false,
                    style: null,
                    enable: true
                };

                var linkSetConfig = nx.extend(defaultConfig, topo.linkSetConfig());
                nx.each(nx.extend(defaultConfig, linkSetConfig), function (value, key) {
                    util.setProperty(linkset, key, value, topo);
                }, this);

                linkset.adjust();


                var superEvents = nx.graphic.Component.__events__;
                nx.each(linkset.__events__, function (e) {
                    if (superEvents.indexOf(e) == -1) {
                        linkset.on(e, function (sender, event) {
                            this.fire(e, linkset);
                        }, this);
                    }
                }, this);
                return linkset;
            },
            /**
             * Iterate all linkSet
             * @method eachLinkSet
             * @param fn {Function}
             * @param context {Object}
             */
            eachLinkSet: function (fn, context) {
                nx.each(this.linkSetMap(), fn, context || this);
            },
            /**
             * Get linkSet by source node id and target node id
             * @param sourceVertexID {String}
             * @param targetVertexID {String}
             * @returns {nx.graphic.LinkSet}
             */
            getLinkSet: function (sourceVertexID, targetVertexID) {
                var topo = this.topology();
                var edgeSet = topo.graph().getEdgeSetBySourceAndTarget(sourceVertexID, targetVertexID);
                if (edgeSet) {
                    return this.getLinkSetByLinkKey(edgeSet.linkKey());
                } else {
                    return null;
                }
            },
            /**
             * Get linkSet by linkKey
             * @param linkKey {String} linkKey
             * @returns {nx.graphic.Topology.LinkSet}
             */
            getLinkSetByLinkKey: function (linkKey) {
                var linkSetMap = this.linkSetMap();
                return linkSetMap[linkKey];
            },
            /**
             * Highlight linkSet
             * @method highlightLinkSet
             * @param linkSet {Array} linkSet array
             */
            highlightLinkSet: function (linkSet) {
                var topo = this.topology();
                var linksLayer = topo.getLayer('links');
                nx.each(linkSet, function (ls) {
                    if (ls.collapsed()) {
                        this.highlightElement(ls);
                    } else {
                        linksLayer.highlightLinks(ls.links());
                    }
                }, this);
            },
            /**
             * Clear links layer
             * @method clear
             */
            clear: function () {
                nx.each(this.linkSetCollection(), function (linkSet) {
                    linkSet.dispose();
                });
                this.linkSetCollection([]);
                this.linkSetMap({});
                this.inherited();
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Topology force layout
     * @class nx.graphic.Topology.NeXtForceLayout
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.NeXtForceLayout", {
        properties: {
            topology: {}
        },
        methods: {
            process: function (graph, config, callback) {

                var topo = this.topology();
                var data = graph._originalData;
                var key = graph.identityKey();


                var _data = {nodes: data.nodes, links: []};
                var nodeIdMap = {};
                nx.each(data.nodes, function (node, index) {
                    nodeIdMap[node[key]] = index;
                });


                // if source and target is not number, force will search node
                nx.each(data.links, function (link) {
                    if (!nx.is(link.source, 'Object') && nodeIdMap[link.source] !== undefined && !nx.is(link.target, 'Object') && nodeIdMap[link.target] !== undefined) {
                        _data.links.push({
                            source: nodeIdMap[link.source],
                            target: nodeIdMap[link.target]
                        });
                    }
                });


                setTimeout(function () {


                    // force
                    var force = new nx.data.Force(topo.containerWidth(), topo.containerHeight());
                    force.setData(_data);

                    var step = 0;
                    while (++step < 300) {
                        force.tick();
                    }


                    topo._dataBound = graph.getBound(_data.nodes);

                    topo._setProjection(false, false);


                    var px = topo.projectionX();
                    var py = topo.projectionY();

                    topo.getLayer('links').hide();
                    topo.getLayer('links').fadeIn();


                    nx.each(_data.nodes, function (n, i) {
                        var id = n[key] || i;
                        var node = topo.getNode(id);
                        if (node) {
                            node.cssMoveTo(px.get(n.x), py.get(n.y));
                        } else {
                            console.log(n);
                        }
                    }, this);


                    setTimeout(function () {
                        topo.getLayer('links').show();
                        topo.getLayer('links').fadeIn();
                        topo.adjustLayout();
                        if (callback) {
                            callback.call(topo);
                        }
                    }, 500);


                }, 300);


            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {
    var USMAP = '<g><path d="M619.5394298853671,313.80444441962175L646.0228861840691,311.4546901823777L650.4620913875144,327.25109005435263L656.9206186672232,350.4640880226964L659.3042908947791,355.47200105830575L661.3524567879306,358.2370314101721L660.8837985564303,360.15513493783544L662.809007471431,361.0689702018459L660.4312830693754,363.72660279493334L660.7885696688766,366.06513662732937L659.779795180524,369.38805660603373L661.9763923370286,374.8219408104094L661.4183970820984,379.8472882980037L663.7412930790721,384.7439769130748L655.9367154126533,385.73370516760747L622.5387014946745,389.06584995859964L622.2327563642075,391.56447912210604L626.1320089497606,394.8192981102334L625.7966132630955,397.937660717364L627.1620505584219,399.3575538508818L625.0416360755073,402.326796882017L622.8996395471405,403.13401857381155L618.5954027331705,400.42176628265315L617.7658160619673,395.8630744067086L616.4983212460745,395.45588474121485L615.3011008338744,399.05389601351794L615.0546918254754,402.46780522924496L610.8520997538458,401.88531814066005L607.3571997120409,373.4427596390018L608.0640939965136,337.56291279807067L608.5384133625773,316.83508354900266L606.8025548680392,315.0121749862352Z" id="Alabama" class="mapPath"></path><path d="M240.44981073501702,473.33857001002207L240.20973372052666,472.28435286470426L241.1748094034017,472.62722108725666L241.42988419136572,473.7143827440516L240.47263470102263,473.8996098180508ZM238.9809896019384,471.72690679735246L239.8931550034597,472.2435419498438L239.904519246838,473.4532488795027L239.48552320903957,473.1818634067846ZM232.89583754132377,466.7817652896703L233.67633571953127,466.37349624044157L234.1117238063512,466.49327251770467L234.3048915084454,467.4493279835266L233.6373637226233,467.89687575326434L232.7877513537724,467.53383541376377ZM230.94447360790565,468.013726518352L232.5006334247106,467.74033239514677L233.26686392379438,468.8105525663915L235.20404148609,469.6434582798637L235.9911029769058,470.28696782558825L236.2575880360404,470.9534220224226L236.66664846315803,470.9667777505118L237.0224184030631,471.8297431782959L237.93697634089006,472.50263436034896L238.28016837259742,473.25584780966216L238.60412749622657,472.87992764742955L238.9874350902054,473.4297336029205L239.89289097172303,475.80605243153923L239.82507219939288,476.4349069766892L238.79174335656737,476.67394415304244L238.10543235909046,475.5459027129643L237.78855464500305,475.76588108801144L236.7611777419828,475.0900960559714L236.64843393368764,475.46699641828184L235.94334898046912,475.36038664022107L236.34284484600983,476.24646377367014L236.8308765107266,475.8213590666992L237.31490128805382,476.0376084249615L237.55693988039724,477.3526618854023L236.82416290556128,477.4444382991171L235.2623961320455,476.18531383967286L234.70483612966274,475.4627558122674L234.48781094679353,474.592148376329L233.6935228509086,474.92278742366767L233.48635700557435,474.27467892787104L234.08470884591904,474.0073166770723L234.5158954321436,473.22756781816435L233.91411995530433,472.2931169187857L233.11734882173374,472.3241906754048L232.4774555035267,470.72314188649045L231.94863743883855,469.989102693517L231.63730830000858,470.7273431744123L231.15496726255935,469.86487369219003L231.52733421484336,469.25803712654533L230.77467417003726,468.3307703468232ZM232.01454391921567,473.12578759408217L232.82000779096137,473.32174065360783L233.11952431037264,472.66207840717396L233.6585995317863,472.7522346426747L233.4716521003338,473.8281401244682L232.62984491901622,473.7954770575015ZM228.73492599803544,464.72342059130585L228.05991748466846,464.2570061327339L228.4883109038753,463.67280007037675L230.50604776658238,463.6731084571234L231.30932398971396,463.37556426093937L232.26290431358407,464.34714413288106L233.63862474910465,464.94982560774866L233.76481079439063,465.701671955242L233.3276768701282,466.2622297552361L232.5035481932117,466.3441095307365L232.10351075685227,466.9643998732983L231.26399051120842,466.93334148373657L230.52331953804747,467.4700776403896L229.88996363619572,466.05287182227755L229.6624123821872,465.071472626809L229.03649364488626,465.23056238332583ZM228.8950737812239,467.75337971823126L228.27642722253196,467.41836772322245L227.45493760874567,466.5440991722394L227.15889603274488,465.77175815342855L227.45465237961633,465.2691046717986L227.99958225132588,465.51471837705355L227.89215433568197,464.83457347512615L229.5866403025667,465.5467137187979L230.06256850935137,466.60016347417053L229.63626248987123,466.8844987009061L229.71978478178815,468.2109185326043L230.16699121467656,468.4468376173131L230.19833706985324,470.01449097493787L229.56977675407504,469.87159770733314L229.76831591503117,470.785672051472L229.28766222810026,470.44600540644853L228.54310441339334,468.76182688985415ZM227.47267522869396,469.5356866367464L227.5747144720294,470.2910887637029L226.9753247465692,470.0210272580886L224.86711176614847,467.61363342573617L223.8185945291452,467.0208069258846L223.91139261170315,466.28474727849243L223.13720432958505,464.79014971357907L221.88184003107932,463.76731381332L222.43233988169544,462.2667191122945L222.98672795092213,462.6672343062635L223.90024163047644,462.84982052425914L224.63992401982557,462.70654135949343L224.9544155124372,463.6988534279097L226.63767455066602,466.75348827814025ZM223.56898718142457,457.44397033926094L224.83090674773985,457.5884326726906L225.45812908125515,457.3213590720683L225.56990141418007,457.8129520391001L227.04218738537128,459.23621282582724L226.30357676868465,459.16485586810705L226.3199557998609,459.7985231523417L227.30712441074374,460.4697575309267L228.01899447733473,461.97719441504125L227.42905840234124,462.6116653245891L227.35844380270663,463.23436903875324L226.53579177511693,464.7234886037641L226.17186150994482,464.7957440847817L225.66213282857416,463.6375133906188L225.68552122954011,462.8435569721803L225.25453243703564,461.8113199570513L224.46009135859038,460.6253445616543L224.3274993962191,459.9155768956701L223.5705337302997,458.30540402180964L222.9228281874362,457.71093938954874L222.4309063092024,456.50812064416186ZM221.37506959499643,464.170997726539L221.85749586154895,464.035271932853L222.6826497439182,465.03215076394076L222.6843785737181,465.88964577306166L221.96562226408133,466.27873404246645L221.728899677962,465.0035456735654ZM218.43008229785906,459.0260677539708L219.43657879916788,458.78574246352554L219.9328391264438,458.0502120356176L221.08845817943973,458.54355611677204L220.81669940992168,459.51703799683673L221.08686595734557,459.77625295586216L221.2926076583455,458.7092026625285L222.52339016624757,458.68924285646955L223.36045740682815,459.19169954150357L223.36166219409142,460.5388049643198L223.6842725674248,460.55608287738823L224.55835731750773,462.0942687318907L223.74575311366553,462.5958713881639L221.72021513042984,461.7236943393413L222.1689286649888,463.08880779617726L221.80772691462062,463.7882703677639L221.12837545030735,463.7182737955269L220.51758807975216,462.9570053348767L219.65425452780792,462.56236565884524L218.78996768556019,461.4959530572627L217.96206530956138,461.1246599848101L217.7283514664012,460.109238790319L218.08992461032872,459.6396915055162L217.99997159637624,458.73385745651984ZM180.6695518561532,452.8510929471005L179.47332030701972,454.63382170297564L179.42954724330554,455.28801658407576L178.363660465346,455.8225110929213L178.50223596275413,454.79912247984214L179.59085857012317,453.6472789983394L180.21638212601783,452.4283916221354ZM178.87780610707776,450.53978310377454L178.83448841491168,451.91591036786605L178.50965204381214,453.3547054228132L177.8310427371705,452.9484877140301L178.20909090152094,451.2895224767742ZM172.27670325148347,387.8802065483302L172.5365068469119,388.1381224964199L173.73253782769325,388.3019617041878L174.32879619585773,388.0623126693619L175.17612204786,387.9687877867716L176.12572163806487,388.1060849551881L176.64905314730137,387.9008642087698L177.24294547689735,388.35833561574606L178.2816717673112,388.8264988418426L179.59715499386496,388.78741404442854L179.9046822990325,388.38773268703085L180.734643911052,388.0518310642368L181.033877228687,387.5438342930411L181.9526754985167,387.3290696915697L181.9902811175196,387.643659913739L182.51300913774287,387.38118655436455L183.73252369932683,387.6767581627334L184.64473036477986,388.3400445655054L185.43968222193607,388.591366064595L185.66319472812114,388.9087743726129L186.342984694267,388.85477816961554L187.08525157226381,389.3240616562749L187.28239251439123,389.681161345082L187.60649059001292,389.29513769652795L188.12500309305796,389.4447181931254L199.98178514494336,449.24312321511684L201.56229145461376,449.47388589593675L201.63681725465975,448.871486135466L203.34832937519934,449.35606669327314L204.04413606503823,448.1391789828331L205.93165450202096,447.6067412530922L205.97689956498527,449.4022692036946L206.5987644234779,449.88712480989784L207.8244967124544,450.1931906381289L208.2825594156798,451.0452371594948L212.37040207107344,453.59871588513164L213.4238400787193,455.59261405155036L213.86051734324838,454.8504060755975L215.01622949451095,453.47203438336857L215.8020412289473,453.2254417511026L215.96649112999657,452.36252972416764L215.62207792779125,451.2273798306751L216.18165530836472,451.07541260077727L216.0464042878397,450.0321375883237L216.96970822123598,449.5161442339205L218.19588702582138,448.2362021729573L220.06140142846067,449.3039153596626L220.18541955380937,450.2411166336382L220.79774848741522,451.03483120170887L221.6804659808515,450.99759327462806L223.1186580017393,452.027237625147L223.16335525733302,452.4266966515462L223.85920283262064,453.00308217485525L225.43858715290617,453.4163295377423L228.75463409041527,456.3174232525685L229.38855546619035,457.1685579707207L230.38609155876844,457.8996191507051L232.1018410831677,459.6751753421313L233.7314498636988,461.1331528345071L233.59943699162184,462.0113586849341L234.757900301672,461.92023538737794L234.8719112303064,463.0947181509581L235.89204179571607,463.2370072247147L236.43764253218126,464.4525245524715L237.2867294583634,464.0803506789814L239.4152030246081,464.7704774483317L240.5424677910164,464.62935239739585L241.30411090295414,465.0378671642874L241.88778145814956,465.01376526981613L242.26109799528854,465.5636463291726L243.42505897149113,465.3202763291847L244.03954576947535,465.93135056545384L244.0506731613103,467.4972813577445L244.5545052668669,468.6093290207142L245.7559747860128,470.30001531616125L245.5511140188668,470.9131315626571L245.34631141295637,472.93934259737995L244.56630661015177,474.63890577372456L243.98371551030877,474.1278317606001L243.59153287954598,474.4988251389339L242.79995110181721,473.3386714623623L242.70195592136247,472.76506351085203L242.0864279491354,472.2636998350792L242.6489929374169,471.2989747326633L242.33382387647083,471.1466039323927L241.83150087591025,472.2790650813572L241.1969055962743,471.89728377713664L240.8050257252786,472.37832279221965L238.87224154253371,471.5371428123268L238.85103527304238,469.87561611526564L238.11199182251772,470.7007117487526L238.33040942491732,471.4590515278446L237.4053958624139,471.1322276317893L237.01002151064722,470.47204559098464L237.23886262949787,469.5230892293401L236.82024326931025,468.7951346657423L236.35630199234276,469.6721726920935L235.2044559467814,468.50954540083126L234.87876474999376,468.9207188625504L234.22948045258258,467.85218721964145L234.63880184244897,466.88421905313567L235.27716594357645,466.66932144457326L234.7800528945499,465.81530758826756L234.71356263708947,464.51272253093344L234.2043124951653,464.72252755755966L232.78610545887676,464.0613402183402L231.62331593385602,463.08436945786013L229.56466271388854,462.76879720311L228.8059038846082,460.26079923334265L228.14297291273311,460.13222702585324L227.94552483135766,459.0651218644806L227.2788591148344,458.97405335911145L226.00162794763554,457.86766539457574L225.54494036074794,457.2194748026489L224.01404831918936,457.42297306780756L221.86472010812193,456.0381343888975L219.92573752353513,451.88850855104505L219.89809646250538,452.980931534323L220.29822551540582,453.8376683878736L221.43867838827532,455.37684941318446L221.35844638792986,455.69953897833375L222.20134379172427,456.98742077831275L222.38393818828817,457.94432205739685L221.6920828628654,457.92136978284526L220.88930869169675,457.03156829849706L220.17503208151356,457.0487354183684L219.31712830259846,457.5887369395483L218.91969457132237,456.09620063853026L218.00228751111567,455.008971376163L217.5901523549446,455.5322035573527L215.18690321751558,454.76464432174845L215.10948509327278,455.1936645368798L216.34312847394347,455.3120254957317L217.49986498304835,456.1154535722439L217.8493255011262,456.05709268016005L218.1852004591701,456.85882270081555L218.90261441658063,457.70404773393926L217.91668520400458,458.5704095609162L217.15369761249713,458.4043813844175L217.36819724991648,459.27639833425445L216.32205484523683,458.84869065993814L215.90437095230394,458.43872253916373L215.36155955217964,458.580527282297L213.54128121235814,457.71222292843174L212.1649630362052,456.87142722419946L211.8936900627869,456.2353901466193L211.04643269528296,455.40749588347563L209.20334917464453,455.1103713798122L208.10673342500792,454.5914861938083L206.3004091211232,454.11747393614064L205.05993313158655,453.5448213391639L204.9566685076888,452.6479226051424L205.31772839630048,452.86307345139187L205.54582834540327,452.22395951627L204.91645438344597,451.03814251970124L205.1975029012362,450.24002274056494L204.91874775420547,449.97051805419864L204.4256342605205,451.47642667153895L202.96177858759143,452.70681056031196L200.92377789605698,452.7929054724462L199.11070385461647,452.30502427984806L198.91902547647243,451.6831367635178L198.1738643035538,451.9703518498807L197.26431737466862,451.6637419296451L195.348284872752,451.5682129092888L194.27303845936297,451.71638197782886L191.92463560858462,452.46401525541836L191.10034357292804,452.84671927934176L189.8701443000531,452.08732597755255L188.4566019480845,451.8564405758858L187.95594332662336,451.3462386217376L187.66492462213867,450.40714434040115L186.75067938457966,450.60463221803957L186.55034496908968,451.5015401505164L184.76034988505037,450.57297887448635L184.43693530667173,450.1062460629895L182.85562606542462,451.2365676772937L182.15695851247918,452.4371921234371L181.69103621274667,451.4403560677127L181.9773600220057,450.8301049908425L182.4824780531227,450.9177220744968L183.99755014881282,449.97917045033864L183.71991043824912,449.4336686925882L183.00737191776938,449.8079526773511L182.62517655321835,449.0927383946099L181.92031983131253,449.0646528093043L181.02108352921593,447.24810476103397L180.81367415659022,447.7404697419373L179.87574086916544,448.09235106363843L179.54005507768636,447.87387555332555L179.2737469323815,448.5147121916596L178.04431865587281,448.4175546627048L178.05643089892175,449.10217573670303L177.25847100305128,449.35605919419936L176.85487432915647,449.13951575993036L177.02296693450268,447.8979949771663L176.6817188520214,447.96436008104945L176.24040059882543,449.3010354165078L177.0411815714533,449.66413863709363L177.19370530611099,450.5885570079011L177.75623653858509,451.54800112715895L177.57273089752795,452.6471777570943L176.92505475973596,452.3438712546825L176.79561695375506,452.89617245667733L177.41415666045606,453.0582790368471L177.87941047027283,454.4596012445721L177.03388236819987,454.8232915981384L176.52930250965522,454.5779819908306L175.79700302911692,455.03519986093823L175.3797064294429,454.74415949008323L174.36855032056732,454.85781424479575L174.36405386432781,454.3176356147473L173.9107456022205,454.71124932333345L173.6924396217476,455.41141173752595L173.22218476000532,454.831987878319L172.74574930551967,455.7287180965336L173.00466979750098,456.1074986369792L172.28520768946382,456.6591039251451L171.60776126847966,456.77354346101345L171.37926229200136,457.4713155760169L170.67527373593225,458.12410669729826L170.15786261994828,457.936789255403L169.63538196973985,458.6840203703686L169.18088089059253,458.67100220859413L168.30571836735984,460.18718275187456L167.28899217910404,460.3386538304386L166.9423477419589,459.88501439277985L166.35191817478855,460.69823765022966L165.05399391784815,460.1304353592421L165.3102193347469,459.0080912308024L166.1303016587311,458.5849922003001L166.67600921498354,458.63680026712336L166.82221604531307,458.1996857670142L167.76051348972442,457.29806712934226L167.7653063266435,456.5785202455268L166.52824807245958,457.599625677287L165.44626466623563,457.0623766191996L165.30774752372517,456.6713894534274L165.78881041015768,455.00144576586683L166.65075897550608,453.7831456604418L166.75411129561192,452.8081031904862L167.01114499462378,452.61797212421993L167.0738714813413,451.57240355820034L166.5734010982242,450.4416401099066L167.6521914204523,449.9650984751568L169.64892642377657,448.21185667917274L170.185525541093,448.82992482372606L170.83609685915937,448.9720850014612L171.74410715388711,448.2318064644461L170.63888233086504,447.3999556236827L170.18763425620793,446.7423474101674L169.36944890524643,446.8594728374871L168.77061514365326,446.56668104807085L168.61375208369446,446.86232350797394L167.65798857192033,447.37507666102056L167.24973272381004,448.2921168406669L166.27451908493774,448.54724220183914L165.2898761470787,449.6249879416598L165.20797731665326,450.31080496855327L164.4345290884276,450.6941196421951L164.28122582254196,451.45343361059633L163.732715770074,451.93544042998724L163.50162051334092,453.27119958648603L162.42300036684867,454.15720370168924L162.96975348989332,454.828988390122L162.5446138819337,455.8441051618041L161.5105359505116,456.04149503659806L161.4395937403813,457.33626961200576L160.4723389828274,457.81511879262325L160.161162737016,457.27894931673563L159.68163737452963,458.2886065713775L159.10335003333626,458.3273769817699L159.21475322185992,459.0455734767376L157.92619516049172,459.4782289221183L157.6659828388054,461.4536712689905L159.15163939184174,461.5608372565747L160.33058736851862,462.09219320745535L160.6683879264785,462.735559108765L160.19760622540102,463.7817997723037L159.40399560215832,464.43361057195153L158.66075806242802,464.4718838550005L158.58710345847805,465.04668349315926L158.10244970979468,465.2622423378118L158.3262847486232,465.9806607987682L157.8187693147631,467.0575059266689L156.7214553730678,468.05796449546955L156.09838723525306,468.0527749122134L155.48978908293265,468.4051655780762L154.9046679682634,468.3253826010978L154.44433822716653,468.7130891607848L154.56811460566016,469.25378073671015L153.7083144247021,469.5254529178606L153.52091507457177,470.3116188323285L152.94156562428861,469.79613638165256L152.25447249401003,471.3232498359168L151.16628896517787,471.1845510795383L151.21769347596793,472.0120718084577L150.5718438999544,471.77601314657295L150.0987057337081,472.1189300898563L150.0594908135081,473.23079220697815L149.259738012085,474.9248462148861L148.0642261967702,475.0913586998395L147.05375216860062,475.83543955003904L146.87683189398965,476.2579195037442L146.28203068735013,475.6178593373481L145.13771801301493,477.209411659701L144.86953723517183,476.727399809094L144.2732384506812,476.836625107281L144.08047652605032,477.7593073379534L143.4481400900808,478.080047945838L142.72837429411373,477.8904270805072L142.09439363059903,478.7826536642101L143.08440884051572,479.13502306564266L141.854772712339,481.1378497986578L138.64756434017482,481.5815302702861L137.61349245732112,483.32943990749305L137.425603116664,482.91789674417436L137.6435730798951,481.78572159426596L137.0388950010379,481.5535863922975L136.22026799458277,481.91214941386636L136.05767996831145,482.36506887311646L134.76191936567545,482.99893124318874L134.15454231898624,483.8034574147728L134.0533557112646,483.18146906980405L133.65951076168923,483.8620751013L132.98103441239172,483.324603401179L131.51136037439957,484.2846971146319L130.504667628076,484.1364949898218L130.7425823209705,483.2982998852403L130.39353343560123,482.4292857488404L129.91352663924636,483.05899895779345L129.8710294782653,483.77528625987475L128.25534125851593,485.78273635882834L127.85349081003069,485.1922797460518L127.60979916862891,485.9918298484673L126.69167201127544,485.73152301940763L126.71399929465152,484.43478122598196L126.18485927228284,484.0770920404829L125.92191983190415,484.5120495133512L126.35413319638008,485.146455666235L125.99447751563392,486.0021725321018L125.17946341557331,486.36363102557243L124.74405214068645,485.29328085689406L124.0637766079683,485.1272549991864L123.88754965219928,485.5003082657783L124.50087274767142,486.1633545620098L123.10720359745093,486.9085707069361L123.9313291363114,487.27718861321387L123.89289339696032,487.705389726564L123.22058728646252,487.28609557560355L122.13536830805344,487.9980620486901L120.27399589785355,487.6841572475113L119.26307804656068,488.1067977874714L119.11428347357905,488.51798091301845L117.96520974774046,488.8419512130986L117.21187602804332,488.53780306628084L117.1435580462032,487.293656102124L117.98471928145239,487.0329872281246L118.80990423619241,485.67991087694736L119.58835425244752,485.7671469519503L121.40069064574841,485.0675903297485L122.74508413927228,485.2294455654715L123.1213502302191,486.22369515257407L123.60344436803729,485.6050491043875L123.63223150203738,484.8136793465872L124.45132583006304,484.56646342260586L125.28146182516915,484.6795671850245L126.61710922105176,483.1221706179134L128.03579534304797,481.7499658681204L129.7969694301949,480.59217743184837L131.7365641757133,480.2003979826341L132.4816084418812,480.5697372409717L133.27914017115464,480.2573706046699L133.4192672616679,480.8483705404683L132.9334548822436,481.4464450365249L133.34184309556053,481.9931894504137L133.5622465145246,481.2233071750722L134.50788238024376,481.2461071979269L134.71892867070693,481.77083488282454L135.2824294149926,482.0049465618794L135.35992428365745,481.4003702076486L134.4538234110684,480.77261691593185L134.40944654557038,480.40806948209314L135.2080056288168,478.7932733939322L136.14759145959613,477.9097662538693L137.37181232876108,477.0842946525933L139.24402427707628,476.4141034091196L140.64382385695208,475.3354343438208L141.23630051865385,475.8106099510294L141.7563977525908,475.6677661574769L141.59510012548844,474.90117096227124L141.8009567101874,474.1963553543318L142.88914757158267,472.7599184078431L144.29647629013218,471.87783156894136L145.44333364622318,470.6499152248071L145.42608666651847,469.9298770518339L146.54819820755176,464.88399302527847L147.91491992490214,463.58471586236845L147.8174181421184,462.5013223313715L144.6296059156918,463.87619529396846L143.65902116032018,463.63500412268L143.46113142261092,462.97400284917126L142.92706220543602,462.649869158085L142.7926526401188,461.9203713809301L142.27338045780013,462.20773030982605L141.87918906872056,463.2956193739229L142.3163009166442,464.7316132868007L141.6201829426629,465.2934020071097L141.05840732428118,465.0351095251803L140.12132726930693,462.72732290932333L139.459399651941,461.5548869186713L139.07419073830766,461.52189539202357L138.74524314388327,462.3226136027602L138.4011599387182,462.436431252486L137.96607567076217,461.71183676529336L137.37045174920337,461.5483303992397L137.2010868433885,460.41360298141683L135.28369187958992,461.4864014554243L133.57146535972967,462.20598286861224L133.38695071672555,462.6914534147844L132.0272553017613,463.29514476485986L131.48014425564884,462.542956806192L132.14367999492464,461.82597266353696L132.1613639199187,459.94704430154536L131.97866974452083,457.93515079005766L132.90462519387097,457.2126388594383L132.41769299709117,455.490762121929L131.94247410948066,454.4921245869846L131.6495948670159,453.0800519415142L131.03448741878893,452.4228600598332L130.7071682069586,453.57643556295557L129.84301565932427,453.71716173185865L128.41231079221427,454.28437830188113L126.76918901515921,454.3764787214366L125.91027127474538,454.1761789707731L125.22579624335324,453.67198515893716L125.29659000642457,452.6284681620477L124.71320327510102,452.21002455862657L123.94242574977602,450.6309182043572L123.15262961589313,450.20961104820526L122.4450996650964,448.4865155766712L123.22056657133658,447.88914437177357L123.57786243715485,446.60092746467956L123.03358130700303,446.8006680675139L123.10376195767742,445.974255878284L123.45641404527588,445.34159312360174L122.93094156168581,444.63226945526515L122.75319336147211,445.2579539493489L122.0320831681552,444.87685130656035L122.1242531429155,443.7620107521334L121.5591332202108,443.5152359767521L121.37360150187712,442.71497863164967L121.55708947749605,441.79888057531815L120.8940407439577,442.11592283079636L120.95686361399515,441.2141531738346L121.7122222256996,441.13326674303113L121.31144966259959,440.03750597817617L122.35193395221609,440.1533710028587L122.56700730338821,438.9511152625051L122.95871704919617,438.18178115327544L125.28222565224456,435.92267264924783L125.80105131739428,435.20837309972507L126.05271298362624,435.3954804952184L126.07228099515149,434.27069949255895L127.08396916228884,432.50826090188184L127.80802142224407,431.8607857590291L128.98577037410337,431.7168182053651L129.81251652891484,432.1673933231561L130.8784828130801,433.48172071892475L131.69967554412017,433.4509630075426L132.95066384672458,432.49614703165764L134.29295629691632,430.96797615082374L134.88442348316576,430.86039509990724L134.9748466136819,431.30511834518745L136.33852757509578,431.465831786279L137.58306001727928,431.2431044684264L138.8396177162814,429.6078041128848L138.88339197764182,429.1796685061756L138.52289077421267,427.4840758045087L138.56221218265526,426.5150140296408L137.85675427957426,425.3937727400517L137.6487954909002,424.4695195132779L138.4477799725995,424.8090976933809L139.30588039530608,424.1426189619556L139.42470243525213,423.43466243956095L138.5639855879458,422.0117940540446L137.70937572628947,422.96247240847356L137.03269151524583,422.7051000743904L136.31376065331017,423.1974498241228L135.55247258579044,423.24922322169544L135.32152583054724,423.61759922298756L134.39615618613246,424.0778897944899L134.01143677360793,425.00344135548545L133.53024191856383,425.3375830466409L133.48310824907787,424.1744167393617L132.99834963154876,423.8555831842517L132.509360977796,424.6923347848373L132.35482987756316,424.2365888132003L131.4862353640964,423.4610269505746L129.52103964617186,423.2005582283875L128.00905641342428,423.68388459227214L127.45870368825115,423.7016607290411L126.39108678853803,423.08363484237873L124.33043261577652,422.20400650822853L123.84500601529598,421.7122420215887L123.70952494547328,421.03036741245666L124.07094700363645,420.1876877819722L123.45248103889367,419.30387353116953L123.7568247881339,418.52412987271885L124.31053870494839,418.19278164993085L124.35728574495396,417.14539366161387L123.6087908185209,417.00098899358323L123.04861912015585,416.5989942040081L121.89242924687713,416.1462162096849L121.3748444823861,415.49081282708653L120.52818755221247,414.7627059310423L120.5844843455694,414.0799242031555L122.25302626537959,413.51900031379665L124.41299421335219,412.4228523180386L125.87942535691437,411.79487600078755L126.530065512513,412.42416166441075L127.26902737370982,412.66691691810945L127.56587858066648,411.9943458495363L127.12878237302175,411.80717539497414L127.19407105463712,411.2022072133256L129.16569378434994,410.5335265911993L131.30616546995856,410.1253023128222L132.40335013814618,410.2228323642097L132.95964827424334,410.5585944895241L132.49008650550212,411.57100152909624L132.4933398527507,412.32943109804546L132.18513000664538,412.8248216053701L132.44638189027563,413.73046822368883L133.18699235337147,413.6942388700231L134.07476337170309,413.96396866526084L135.15131439023963,413.9296937600256L135.41243224123176,414.2883115592179L136.09707067895707,414.4484842963884L136.7438334214264,414.20532533786513L137.49617573409952,414.65609376177645L138.4257061928494,413.3260944022679L138.9796422034252,413.31660159629905L139.3223153619342,413.6416256605899L139.59740521108188,412.8454820200694L138.59623496499168,412.3395289206826L137.5583699454841,412.5417610616053L137.78511702719976,411.4906079552712L137.1435951461842,410.2628496647989L136.3425052523108,409.8023049124511L136.22267306405678,408.74431673072786L136.91160719105685,408.5811659567836L137.62596832471786,409.71121386087543L137.37172711347557,410.5065015180545L137.70533672085293,411.19362487436956L138.51443314997127,412.04282986485936L138.8167104877892,411.2871996578582L137.91721846879585,410.1413011253415L138.56935186422157,408.3518186260929L138.25828596729386,407.9923254156827L137.2212789911289,408.26089123950595L136.21720859502622,408.0248352561375L136.1058723881594,407.6868127321606L135.548734632006,407.9360306203948L133.5349425007866,406.86000393711623L133.6133396908752,406.04365061319567L133.2527513505627,404.1543232958007L132.85275766337742,403.4092989679271L132.14350035154706,402.7217300624715L130.7879084933704,400.9133567837969L130.15824780686566,400.1921293444222L129.4529978057455,399.9229695317662L128.56137253394886,398.67735668105126L127.62374456728006,397.8854520555877L127.61182928948263,397.6664035527885L128.4558843680203,397.50276579833036L128.99034436133658,396.5931308416352L129.3790565410135,394.6482885429056L131.43552704048952,395.1605173426691L134.03206661571727,395.1200536726755L134.74138761651346,394.87101274380836L135.92401523043918,394.04507843065034L137.11607025299205,392.6792339781354L137.52426556448202,391.20357416083897L138.1114105610115,389.9668282902147L139.09657119912887,388.99488766078036L139.55611498640008,388.23739681757974L140.74304312952054,387.0720219732332L140.86060720079038,387.4397976084054L141.7054530407806,387.6428956221988L143.0240814930848,387.11321839812655L143.8739550123594,386.49282167403277L145.91944459473538,384.49666546409213L146.6234229280361,384.44953458700076L146.6702065946432,384.76964719585015L147.39742966979807,384.58000060957926L148.08845191664184,384.7004673304807L149.47465408656743,384.510450865123L150.86666542610317,383.64185637547826L152.27288848419133,381.74802614301484L152.81845514768165,381.35079520253174L152.8990445251855,381.70328606677606L154.89120472754047,382.5687980630349L155.04413309122833,383.13188779404226L154.32314928395516,383.84865150406597L153.9998340556908,383.874383023329L153.98262895711377,384.85474592145664L155.0235318815484,384.5666568363001L155.09518008676557,384.04294103514104L155.57065375457609,383.5627139903086L155.72050094132334,383.8454562199891L156.08405335777164,382.732152221127L157.08221174417298,383.7584885186056L156.90774515084973,384.52706493525085L157.54223413947201,384.7419729834212L157.9132903469417,385.1989242942789L158.46672981942658,384.463777054535L159.4374091523128,384.4245168871052L159.98583905016133,384.17415923190885L161.40260575825664,384.3960710882516L162.12879253397057,384.6590965095054L161.81654555385632,386.1745719502082L163.16316737150274,386.5224750785161L163.27336243275013,386.90508428299563L164.6055633430553,387.5221351160932L164.60439586737732,387.2058331721887L165.5241417843084,386.74214720470263L166.42688072620314,386.73046189188585L166.45833939351485,387.08032374729464L166.98506732039013,387.08557509428624L167.50359530210838,386.56186620678477L168.39847943447697,386.4330273231147L169.04543968322753,386.59847674574775L169.95011913467116,387.0581634876546L170.3441672804379,386.92095057701204L170.97967274346908,387.6082252571167L171.28578933664156,387.29965395579165L171.8425665236272,387.46154981727005ZM161.97378893820303,468.2497836208908L161.95945205159992,468.537304060075L160.76280666395726,468.1222706716161L161.58838781898663,466.4239998524632L162.35441135773362,466.2680058131446L162.847927036351,464.71400136715874L163.45556939007855,466.06615203972115L163.9306228162267,465.58786201620546L164.88623771480994,466.3166738090559L164.91633730866502,467.3576823440653L163.54541370020718,467.53687273262153L162.95202863321668,468.0165977047218ZM158.4606548481068,471.47411679215065L159.4528878444612,470.6098551727685L158.55539267758246,470.43303125237617L158.5356036557099,469.6791392143798L159.2750807800303,469.1746081078014L159.80865262389744,469.53080335904144L159.88978975823997,470.2842043020234L160.1907396453386,469.77933776193925L160.2006294531653,468.6662087778537L160.84981703821583,469.1626593883594L160.95538940068192,468.4433210480363L161.5287880311206,468.866915396681L162.21089316066795,468.8563668934351L162.73378916268763,468.45187621741803L163.61950450689443,469.1154861962248L163.6633591001806,471.01768973282384L164.76855407333963,470.84593093037523L164.07333283330965,472.1209298464673L162.71860805062127,471.6478648315923L163.2345943811792,472.46322761683666L162.86294277140817,473.1527790230626L162.16276535421298,472.8423001482122L162.1646373319263,474.13432199288474L161.1028311418983,474.5081540641905L160.75896435512945,475.0501956136431L160.09360311330894,474.5538172340268L159.40083293907787,475.9213782649171L158.8543299426241,476.0667459230883L158.2679546264928,476.67717021145336L158.05408209823236,475.2062015234063L157.232711246129,475.9931270524163L157.1958511936983,475.52657862879875L156.45864448360982,475.05551732177184L156.41105323086927,473.7274757813193L155.70117840709528,473.1823137293093L156.12113171224624,471.64326872136144L157.52438245607271,470.6830838698851L158.3837953027673,470.75622645793464ZM156.39925029891154,477.60203011761814L155.63704414008023,478.92163999867563L155.40233974557114,478.7037397632025ZM152.3369703295404,481.9818528458338L152.91624399735485,482.06712106010235L152.68449928487388,483.4239417296322L151.7222673910383,483.2206409826286L151.57410180707387,482.7505883340953ZM136.42579942545655,485.2756360463392L136.07753970570556,486.6465454986964L134.8268211544788,487.68164684367565L135.54151256530236,485.9865539487306L135.91220639166858,486.20023647555394ZM134.14135328994678,484.55798184245805L134.8296686140603,484.6248035303567L134.74115298335983,485.3358621166589L133.97356169609856,486.0527574257491L133.41669891584684,485.457398555672L132.97953163712845,485.91675288973835L132.88108709516894,484.6826290437319L133.12388086189026,484.3116168656932ZM127.42733070796763,486.2937629265021L127.438041097654,486.8722732642231L126.96412047986756,487.17351938499263L126.71392391826255,486.52835289888435ZM134.00403984929667,429.9551879058386L133.49612446214687,430.54093202704905L133.4282741815267,429.9533058016007ZM124.96419377174469,489.22308048151353L125.73650053275713,489.57737011024983L125.5844937734605,490.09864377145317L124.94765751346748,489.97868682971944ZM114.44511891935048,488.86501333266676L114.5837723372034,489.65168471679095L113.9492900602597,489.8669188097285L113.88020749725929,489.0557097915289ZM113.56090848523445,489.65260429079444L112.27532461081387,490.1465701293884L112.11769723922323,489.60865509306007L112.72906999040958,489.06642467102694ZM118.73066602140264,449.27898160642707L119.50456566445766,449.16747090239517L119.57594737816746,449.6556668102787L120.2377604219705,449.666811978169L120.78755891387576,450.203507544832L120.58340392255928,452.0651013798952L120.1422443916014,452.6070627455049L119.25039306155176,452.8109731454663L118.95733212877434,453.4148477379288L117.87234852177488,452.481308988384L117.30261796903993,452.4091208940729L116.2711786304597,451.255820904011L115.85137018898374,451.17218615043805L115.25964317529292,450.5027665860142L115.18871228556635,449.6080256568836L115.5788905839366,449.4675766262132L116.71747245206285,449.9154719269172L117.40435005790582,449.35431744350467L118.00755272265295,449.3976205569246L118.35509496393306,448.98840897898367ZM110.99399703663478,490.1264569217939L111.52367339974063,490.7347860483609L110.03028125631961,491.6897183394026L110.01087163586908,491.9042827420958L111.77920850172453,491.3273695549159L111.70926511146395,491.82323275677305L110.95164770469081,492.3003518886758L109.83417780884687,492.48889989173085L109.61532080963067,493.06532721951044L108.36096253531105,493.47680889227496L107.36838817962882,493.31628742698484L106.59784132261612,493.7801755673233L105.27119702233067,494.0542628916436L104.73740543364332,493.3587725223725L106.15368414386074,492.96042589545357L106.53010587135068,493.14683863807744L107.60620800151808,492.7810681165283L107.50273301978446,492.1045323684336L108.1775667215619,491.54705957590687L108.92810108751561,492.02263342056284L109.09357105935842,491.61805563365164L108.24709381488708,491.3058544629098L107.86015513841247,490.75492050782043L108.42859342814086,490.06658402019724L109.98679991799276,489.8980810073079L110.12905429266587,490.8353574773933ZM100.66724019897788,493.6751352563775L102.4067282612472,492.78329937833973L102.6055420605851,492.2785481548552L103.29857573423384,491.80865721820817L104.23400357359644,491.71826528037036L104.62566430734994,492.1304660657256L104.61522260722211,493.00448968919005L102.7851910500676,493.5608793324402L101.61035016283539,494.6913485521612L100.79217145166608,494.9840134316652ZM96.5970118537412,494.4819011923032L96.61503798347634,495.14693979560485L95.61460408332853,494.94051083256215L95.61120913352465,494.4988358351047ZM101.86940103709628,466.6589206937139L101.25228381296613,467.1338386218688L101.30660466927611,466.51856989097405ZM92.7459338575722,494.84644851790955L92.84902942368244,495.4987247553217L92.02334691223102,495.7285039642431L92.07836170042644,495.0796588069558ZM107.67037391686833,424.15376972688836L109.642202446249,425.68329782948456L111.13855887157555,425.21626720416L111.70459950675775,425.43279399734314L112.11531868219154,426.0154469744287L112.06523358433026,426.8160036665324L113.09561063115802,427.5096896637869L113.36165235945,427.97908163701663L114.80254149067227,428.5003415986899L115.63032410803024,428.98287777860446L114.93010204802961,429.8179317626047L114.25551973123214,429.4421810268634L113.44557816471921,429.4372351872883L112.95357880624843,429.7633061133815L112.36591192742408,430.6193158049429L112.02522216581096,429.61389966575837L111.5274238655683,428.8638941237363L110.95040335037808,428.6466964379462L110.83539580592233,427.91491860753337L109.62065274951586,426.715692126437L108.96481731036602,426.50713093804103L107.74969935224004,426.9633535360242L107.07969968516304,426.3725253540185L106.96510354270418,425.52251614950313ZM85.43159117341105,494.93587754446366L85.28994703490108,495.6739129702755L84.51027840408642,495.59906820682465L84.83543232834948,495.0249220629021ZM80.38756384457852,495.08459758519894L80.81186433118374,495.5112215723828L82.26106154106316,495.9076600027165L82.263937218097,496.1314722592482L80.45571237831359,495.92458587429803ZM77.96860137993869,493.43874826200005L78.14098014064872,492.82028492214187L78.7598560067849,492.75348386189427L79.34399884425173,493.6079355349026L78.86996644371757,494.0951052515519L78.41813740513041,493.91653476144904L78.36302045847741,494.6088351080125L77.60440345527053,494.44494739183074L75.82875986442829,494.62577327408246L75.01060475724584,494.135326025803L75.41745309762842,493.74331280765017L76.34117835544441,494.117054256285ZM68.86770088838753,493.3304567785656L69.59507510648159,493.4720584385903L69.32531097444085,494.24546139869125L68.4776670756296,493.834945132007L67.06250821660332,494.3525496991562L67.07516533834978,492.99539546404947L67.54792198439493,493.12698700555717L67.93415678585062,492.2437342325056L68.50992912603066,492.41078266265504L68.27186784573001,493.08223470819263ZM66.45870016243909,491.82576988296944L66.76662918057512,492.2784125147485L66.09775415850837,493.2103294678242L65.40123495531236,493.2976786303521L65.61259806744316,492.654609119536ZM62.71645091103163,490.6245308414184L63.34719624855484,490.9014430849591L63.65403843517629,491.8538396215563L62.7021640723008,492.4850323902505ZM33.755766414152816,469.69958046741436L34.200332174139476,470.42530004403227L33.91803516381982,471.04322007817234L32.33643739706868,470.63483281196784L31.936266600873694,469.19612605559627L32.17680716542881,468.7582029991421Z" id="Alaska" class="mapPath"></path><path d="M296.61007318217173,268.88279274345723L281.93524394378124,374.51304338716216L250.0803451408645,369.7655849583282L232.8925926902283,359.8288884108523L195.85798647500803,337.86348829855876L198.11355064879143,334.0135149685947L201.27384031274977,333.9065234800021L202.43071440470362,332.4564930750945L202.27043777468123,328.85831508955323L200.20090083979284,328.3432707753906L200.56878441329212,321.27774056099565L204.16498088492153,319.2616135219545L205.118109285027,316.6147245910074L205.39648708926978,312.1537522067339L207.8496548410008,309.2755521025565L210.47775677706727,308.528698429883L212.7605649151496,306.4511480946602L210.3120085883101,303.24488868218634L209.2151218884186,297.9859285739601L207.36377225981067,294.46584591310125L207.82595407529573,292.1388077019052L209.22311636788004,289.78656760153456L209.57973815938954,286.2810562962321L209.06791360796848,282.49712991338504L210.34118081765644,271.4892704799853L215.86155805723484,271.84426124028835L217.19516688373642,274.4184011448298L218.66318754678042,274.59787507392844L220.79637044619994,271.74984886400387L223.6615221381652,256.84367072628766L275.33170215576996,265.6736305679822Z" id="Arizona" class="mapPath"></path><path d="M511.3535707801563,291.2956526874125L575.5644933585312,288.9069205416637L577.0906913013936,292.4329346311764L574.9467261589,294.8409150489317L572.7866666992284,298.4869852606598L582.4425701964611,297.8821101004751L582.1818227124799,301.4165187284766L580.0333552585737,302.59036561448545L579.7248595918711,305.5058728662433L577.1192107150868,308.7716033601538L577.6475058939513,313.28766114440964L576.3597565713209,316.6743974160345L574.8984533346297,317.2794429192594L575.9104268366331,318.87191425596586L573.587570790335,320.4572637012269L572.6926264873784,323.71224250446005L571.1568415091624,324.62702393729444L571.6189090308876,328.3187107234161L568.9180139991823,329.50327486526817L569.0700113848716,330.7338644467851L566.0532034211765,333.99450668746044L567.0867357409237,336.00348907002683L564.4691689628738,339.13441955549536L562.3169156069698,345.0210518214153L565.1502127355644,347.351254921449L563.8744699525071,348.963851493236L564.9240784042305,352.8275914746521L563.8651996605305,355.4587704419341L525.8688754498158,356.59482332167954L519.1380736476037,356.74889194761295L518.9322411998942,346.7632269213494L516.7161197419576,345.9830388849681L513.6868364166401,346.96499601428707L512.0507371055172,345.24062095280385L512.3494540907443,312.13371750365127L509.2363105372694,291.32806693141276Z" id="Arkansas" class="mapPath"></path><path d="M118.53469178773884,134.35184862301298L129.8703167619954,137.5292559446351L147.60502967795878,142.767446341986L161.39805566877646,146.4068850877651L153.33147788304342,177.97691479588002L147.29790160877542,201.0492552389229L161.23352433545608,222.00704387441567L174.7219733035521,242.29098223694416L185.59322436408132,258.6009647189593L193.5478120720827,270.5619714879522L207.82595407529573,292.1388077019052L207.36377225981067,294.46584591310125L209.2151218884186,297.9859285739601L210.3120085883101,303.24488868218634L212.7605649151496,306.4511480946602L210.47775677706727,308.528698429883L207.8496548410008,309.2755521025565L205.39648708926978,312.1537522067339L205.118109285027,316.6147245910074L204.16498088492153,319.2616135219545L200.56878441329212,321.27774056099565L200.20090083979284,328.3432707753906L202.27043777468123,328.85831508955323L202.43071440470362,332.4564930750945L201.27384031274977,333.9065234800021L198.11355064879143,334.0135149685947L177.47391747904402,331.53049999445454L160.6325488794464,329.5096386058666L159.34018317631984,326.68515497867475L160.12375409456627,322.85349201518284L159.9890791413468,318.0723598861482L158.57006228709827,314.36739159929084L154.88392859519382,308.8625863106719L149.84530855181322,303.33676843686305L148.43265142429334,304.1652866456892L146.30072074408753,302.913277240693L147.06201939541802,301.18881347858996L145.33534874008654,296.85062736240934L141.62514276759043,296.79641149876375L136.08859954176842,292.5628304133727L135.7420159473907,290.13899259552124L132.27679381596863,286.39725469810946L127.54646538877984,285.29812453168256L123.96655118616218,283.0963378671569L118.89897180281781,282.3042225427913L116.94494422449782,279.22807902289026L118.85687539116464,274.2935473033475L118.18375248073704,273.2613149041284L119.69823803729929,269.8210251399265L116.57162611957074,266.10450916850175L117.40070365602458,262.37407669728566L116.01879169038835,261.7889503538996L114.49171717181008,257.95537380090434L113.0121798634604,256.8045342774599L112.8409474627756,254.6181574379733L109.36105340571368,245.6304720707376L107.37256550672379,242.7191506168773L108.46397664209786,236.6986267718778L109.42135896505516,237.5022280549557L111.40841700898096,234.3039264665764L110.26742384701572,230.55475840335794L107.66219964178214,230.25230725834706L105.2101744899116,226.44548497905816L104.69665559481535,223.82931164608033L105.55236969701923,221.71058218156088L104.75159730271679,218.36658113776093L106.11685617350378,213.6005519903781L108.73406488080064,214.34749428186456L109.55424320279866,207.3857007543313L108.20653249701928,207.7526093574137L107.03843242475438,210.9636084068718L104.0738713321673,210.86372914577532L101.49486249383824,207.4275052703142L102.20239385770827,203.00760712794693L101.05406173735702,199.01275163256037L98.8538642270226,196.10345715633957L98.0409404188618,193.27722850789075L95.34702995763462,187.40668868545004L96.44133812163875,186.2256263759382L96.37514602207426,179.62829860269812L98.21116821753884,176.51493177366967L98.53517350042506,171.11374414574811L96.53902389200846,165.11546503042007L93.97855243942814,161.30948807372943L94.31598071718997,157.8502963673202L100.11911716118749,150.99744616139094L101.59094119754104,148.53498274487856L101.56440110048055,146.26280736042634L104.45710472422962,141.21630451585156L104.86948251500661,135.95473628229388L103.78236935958233,134.3292674181522L105.56695748299899,130.5657586170738Z" id="California" class="mapPath"></path><path d="M322.4925455903443,196.17367918503373L352.9038444683383,199.75601968101762L376.23661495224616,201.84152269558513L404.1007452758222,203.91320832831218L402.8988706018394,222.75650272095072L399.45150884012435,279.3470321321962L385.3337202389477,278.27318182722263L365.64912638481337,276.7848684187272L328.46167790672683,273.0146953899831L320.3585440453609,271.95616019009526L296.61007318217173,268.88279274345723L299.6195066119641,247.09022537619057L299.66578842239494,245.01127162721832L301.93620555639984,229.16498675211517L306.8446238635662,194.21046993247467Z" id="Colorado" class="mapPath"></path><path d="M801.6228578416598,149.16244649142402L818.4453477782895,145.22103075217456L818.5231883265835,145.52009904895476L821.3265114567645,156.29064335065084L820.9566409898363,158.19759927798293L819.6988592262771,158.20399294117044L814.1492882396435,161.11558266141924L807.021792199021,162.4779149983308L804.600834412533,165.72997319231035L801.5297283288678,167.32860513707794L798.1697755933712,170.36646080933917L796.6987796247456,168.49146160594648L799.5596631391346,165.6836272381604L798.2331620708501,164.41252618558553L795.7851846764491,150.37374695600272Z" id="Connecticut" class="mapPath"></path><path d="M779.0051836000212,197.63780618908459L778.1983502311846,200.1401574169546L777.014497232001,201.66686858262028L777.9576065828177,204.525712898527L780.6192684184385,206.79685735563714L782.1543208232989,211.21709076888146L786.2037649508022,215.2919757976863L787.6356279137908,215.1842006860512L789.6747984520628,221.3953547758042L780.4903966928828,223.20925784452993L774.1594166568768,200.27900751323045L776.0813674367477,197.74953475879056Z" id="Delaware" class="mapPath"></path><path d="M759.4865657257926,217.37613884048994L761.6321788654304,218.83751529911137L760.1665752816764,221.13705500311994L758.5530790122256,218.7233567751423Z" id="DistrictofColumbia" class="mapPath"></path><path d="M655.9367154126533,385.73370516760747L663.7412930790721,384.7439769130748L666.5468282569723,389.88904002632046L688.4674819361785,388.3893137307159L709.0205451017604,386.9780136292969L710.3827170175393,390.8183587332636L712.2852376239028,390.4346842550192L712.4259171863694,386.5803703271L711.3073079923148,383.22206435284704L712.5701053591968,381.5831311672133L716.4384080204825,382.55778091039576L720.8815290356241,382.60464722425377L723.075416699587,390.458672097521L726.4874888132107,399.15073788409745L733.0163953935125,410.2339916460502L742.2342099153976,421.6726789142691L741.3150432709587,422.7538796742342L742.6272602054456,428.53275086960673L746.7478393574139,434.566139100541L753.7208038054232,446.91376226553336L755.4118984893653,450.8531827777945L756.0343058346862,455.0738663616217L756.7589176174706,470.47979710246267L755.2490510003202,471.04130584964975L754.3771734216248,476.0103357523842L755.1791033322454,477.41537270569097L752.5114536776254,481.34259217252645L751.0872767309952,480.75666088240916L748.1728733785341,482.66508265813906L742.9351904900117,484.32224658029855L741.0631268035786,482.6730578075229L741.3614390742185,479.75927208407217L736.3179129761702,472.2493028275805L733.1474429209422,471.2011600505552L730.7440298295257,472.69542947687944L728.0435257493581,468.49135899526755L726.9364187052602,464.8634226582514L722.8525127889118,461.26569804670214L721.6316760149564,458.67496604938566L721.5990594368632,454.67519123475654L719.5879706058203,454.25211108404096L720.3815337015324,456.4976407253655L718.7411738535018,457.35353511114016L712.0441646235881,448.1503007515693L709.6081567475267,445.92615972706244L713.5152993740594,437.86112752545404L710.3365044002098,438.7276778240505L708.5042566538723,441.35253790806746L705.8364746890718,438.0231131945256L707.2879052392727,427.5241935166756L706.6367977560053,419.05907054492855L704.3995491823526,417.3108992915446L703.3967971865336,414.66542023963825L700.213749927855,414.48789588700924L695.9802718509584,410.52566471036675L692.8225286618458,409.09234726766897L692.281286901648,406.37787368792976L690.1218289424017,405.6319471231402L688.0511415814035,402.80704903131686L681.3847349118196,399.5357577834076L676.1483217913362,401.1186027850838L676.7623852862407,403.93147717352315L674.941749376882,403.63915186833765L668.6658064134855,407.89663470206847L661.6154719676467,409.5336629784879L661.5620239497616,407.47989648895657L659.6141671525215,405.226766033122L650.6667041637985,400.6406114775733L644.4594378190122,398.91953428832903L639.0522898201885,398.8459419389669L634.6216561511397,399.689385600753L625.0416360755073,402.326796882017L627.1620505584219,399.3575538508818L625.7966132630955,397.937660717364L626.1320089497606,394.8192981102334L622.2327563642075,391.56447912210604L622.5387014946745,389.06584995859964Z" id="Florida" class="mapPath"></path><path d="M683.5852647255116,306.51867033142537L680.9096886985141,310.9401651618575L680.9222478971075,312.91554817294855L686.5125598690792,316.214915386278L688.0444455621639,315.69103408685476L690.9367961776401,319.45131030477853L691.7367116565014,321.5248470987576L694.7006035031993,325.0606911831196L698.5416816198656,326.90327198330283L701.0521033411719,330.07753189450466L705.6220358174244,332.6301217855248L705.7732410530939,334.7941165406552L708.9813926689327,337.8528192542824L713.540380657015,340.07371430215653L715.0227729928599,342.96916376841966L715.8048794511074,346.9086417146559L718.1268523752676,347.90116912890016L721.3683526518986,352.4933086160719L721.9503854066797,355.62793759738076L725.7859858986405,356.682825704935L722.9436906985878,363.58553171104825L722.7694207642992,366.94011437448114L721.5827296753121,370.03609292576755L721.8696636010022,373.00416027995277L720.3508222316673,374.59038917845044L720.8815290356241,382.60464722425377L716.4384080204825,382.55778091039576L712.5701053591968,381.5831311672133L711.3073079923148,383.22206435284704L712.4259171863694,386.5803703271L712.2852376239028,390.4346842550192L710.3827170175393,390.8183587332636L709.0205451017604,386.9780136292969L688.4674819361785,388.3893137307159L666.5468282569723,389.88904002632046L663.7412930790721,384.7439769130748L661.4183970820984,379.8472882980037L661.9763923370286,374.8219408104094L659.779795180524,369.38805660603373L660.7885696688766,366.06513662732937L660.4312830693754,363.72660279493334L662.809007471431,361.0689702018459L660.8837985564303,360.15513493783544L661.3524567879306,358.2370314101721L659.3042908947791,355.47200105830575L656.9206186672232,350.4640880226964L650.4620913875144,327.25109005435263L646.0228861840691,311.4546901823777L665.4048252319898,309.0899507325836L675.9679149412508,307.8496403899686Z" id="Georgia" class="mapPath"></path><path d="M337.66825717223924,494.8137793999218L333.3008056271658,493.2012563545584L332.6158690566279,491.5707399185602L333.1786122896854,487.3838387306816L330.0568533721774,480.25652121483887L332.46157681167983,477.9023772971097L334.18420786245156,474.63367322479587L332.9209657413738,472.4998945556187L333.2967879962326,470.25756140973175L338.22615642195746,472.8813487410811L343.7353800229104,474.78349407982654L347.132985243703,477.61295115916414L347.15123676854864,480.05944310660243L352.20744839109955,483.99617367944757L349.13995263110127,487.2861332001685L343.63627302532797,488.85690652141966L339.7797905974825,491.3306239051295ZM320.7458819850947,456.1531316435669L322.7685406806838,458.69100911610565L325.3608831584327,457.5665131348264L331.0421369152031,460.4968195579712L330.186517067289,463.1449109151893L324.4166762393203,464.4853764090948L323.2606272377218,463.97926432207436L322.9650671513999,460.7245050245639L319.9829185852378,460.01785531740575L318.8269551194047,458.1890126611491ZM313.82880507535975,452.80543625407495L312.100272537222,454.7358437920507L308.0667110769971,454.73275542434686L309.31718685767356,452.6002853814197ZM296.87123646959583,443.7382243312352L298.77289607004974,448.10925196087527L297.80504829694894,450.64468199922067L294.06125924124564,451.03625358713896L291.5917247250078,445.84653682837967L293.79665228288155,445.7553008732619ZM270.42965875616966,433.7267357206383L272.4351107028807,433.9482777752147L273.3737288393164,435.8820968491426L272.7749646209711,438.61361787647616L270.74894396974827,440.3185453730591L265.2197772691863,438.1327655419979L265.92197416404827,435.0994914662453Z" id="Hawaii" class="mapPath"></path><path d="M241.797560686922,31.113549917192017L237.83403252580308,49.62479993859699L240.75173023367216,55.5362757710526L239.77309694789233,60.52193843698933L241.70192456647587,63.21141060596858L244.06487220581465,64.53219512544149L244.071595612715,65.88385736507792L247.74070429621509,71.72231369172073L247.88881126318543,73.83029950208731L250.82004138849402,76.39062781166012L250.72015641666627,77.61770772335638L254.4041025563694,78.23877470968444L251.26741816733153,84.69140980706936L250.07107142265778,88.92993603709738L250.84696244080737,91.99720855993826L248.1423672827842,93.54764134645029L248.67731041861927,95.63296502725836L247.64940574099592,97.51449631951937L250.01783242262607,99.96033452477354L253.6705751568065,98.06435885235169L255.32075159721063,96.29916290974177L257.2948425338599,98.54877126120243L256.6570626642181,99.98908784837658L257.2602283750659,103.74750196152274L258.68311017493477,107.86835611282334L259.9992290922977,109.46765378861141L259.2735119374605,112.97912733778571L260.4890967455503,114.76723020909071L263.16075895699794,115.46553494651039L263.795951740789,121.72806799362525L265.11972623322185,123.00874110963048L266.7890778905771,121.53640931268126L270.8566355906513,122.35948321154137L274.1475435124985,121.2663113426861L275.78301138926884,122.4836107121406L279.0032631678432,122.19844116901663L279.47862057186137,123.31816123783801L282.2513470097533,123.0532524959001L285.89275005016526,119.70492916478463L287.444537746396,123.28006692751421L289.50553423066026,125.58425883168934L282.1799350125684,171.46858137784818L266.97354741014306,169.053496240169L241.5033802898587,164.41986129692418L201.25851104669152,155.9241546144723L208.79776218799992,122.40545042484473L211.86215636622916,116.78017219992978L211.1286061987301,115.03862420660266L208.7025249824854,114.1761565967372L208.34506922186074,111.46531342925402L212.43842004627783,105.5587240055836L213.91678283820596,105.26040939042298L215.86190048891217,102.86041200189584L216.02905707292024,101.11376231314512L217.99668084776,99.24346916330535L219.47755023951981,96.21658095297437L223.32557518483674,91.40693412224641L222.82515831661624,88.68088638125948L220.114641147834,86.72148843795276L219.06525348440363,83.24269162905694L219.70937699588058,80.03846732717477L218.76500390945984,76.47935586999643L219.30814344953285,75.03310160530248L224.69273624467968,50.79118222389559L229.85199324167547,28.490963827517362Z" id="Idaho" class="mapPath"></path><path d="M561.9413629642941,176.20400854107584L587.2317328460733,174.8384864932499L600.6760523037519,173.74630886454224L600.5372501459817,177.37503644769254L603.0024350136455,181.3990436751626L605.7949581109103,188.08145482206646L609.67732153674,232.3775615605183L608.4158983304573,235.91050150858246L610.5744899474716,239.76194889425392L611.105167791651,243.03237431322805L609.5324647645846,245.86824619162587L609.2769365599308,248.379151554562L607.0166461906704,252.61924212600877L605.3794902222274,253.0702118373896L605.9772664265171,255.4035352054558L604.9442839243032,256.42401274033716L604.441185311257,260.923313178438L605.023122271465,262.1182791957457L603.3302774665126,264.9541939700101L604.9643571595436,268.13480449573206L599.0948079517864,270.3747952997236L598.6875887599064,272.37550023435915L600.2507791548189,274.73787883408465L598.5210330462762,276.4289407421762L592.906282365004,273.9589470567506L591.232237280129,274.29008261591173L589.216260582398,277.7501324532426L590.016663512827,278.7278305559755L587.6614259227118,278.68922048268337L583.9861778979346,273.5612878969372L585.1067583810403,272.24195556935126L583.6553304439541,268.71828864927136L583.4582248394572,265.83302451075633L578.4788732431662,262.12757173042314L576.9100617959747,262.6424859059646L575.1595364897544,260.2692163561667L570.6314805255051,256.71682124909285L570.5329590364203,253.72212498824058L572.6930395826913,248.7285254744868L572.1912072998074,247.00020830408164L573.4702562289197,244.64512327734155L571.3416499312596,243.4305702860106L568.1464216593155,242.79276533395205L566.594955940205,244.64072717819442L565.4287485961272,243.56894000133093L564.1410022108578,237.43530603328668L559.1533650728968,233.67074505523203L554.5423751541298,229.04454090257627L552.4779551532781,223.35652052517798L552.1423965462385,219.54942004466955L553.2498287369635,216.81036386849325L553.3165619608319,213.39814841153213L557.1345404535858,211.14168305812814L557.3695835276986,208.23733683394096L559.110683462492,206.28702354125028L559.1649018623197,202.97927391617407L556.7366447599358,200.4217290547425L557.4790790934576,197.07971279869844L562.8225818541636,195.86082639099425L567.0093512190175,193.2436204741307L567.2914377408687,190.33605512897793L569.0304322739869,188.99187225884054L569.3370686771614,185.36032661585068L568.8151682236714,183.0189060834133L565.6227596584629,181.35410649843413L565.1324885259914,179.42313577182279Z" id="Illinois" class="mapPath"></path><path d="M626.8169993665525,185.09874278927475L643.0734264228732,183.27789363826844L643.2187173061357,184.50590378953973L645.9365916539571,206.8213951955048L648.7967086331247,232.98975226088749L647.7999544668684,233.93900708345893L649.5781974037427,238.9287853801991L647.0805948100661,239.3257913068329L644.6129666667771,241.37789788019052L640.8285915515469,240.97415258555054L641.3986555750337,244.65165649614494L639.1266778723378,246.46227440338396L638.4384904198707,248.92747606363287L636.0097938040003,250.12558012959198L635.1684370465721,254.99376479779596L633.6318351883278,256.402710311207L630.1955984142663,254.99470320258501L629.4192649339444,252.89394061160942L626.486634937497,255.57853815756425L626.9307865212274,257.61011739195885L623.741682035414,258.65253195711557L622.6072471149,256.8951547151122L619.1269531747237,259.0963012226946L618.1161495845681,261.1624729260179L614.1971432949942,258.7234680301907L612.342955974989,259.51302773500606L610.9507771393073,258.2889884678609L609.8751341756126,259.731769062862L606.2300045524875,260.25406094872574L605.023122271465,262.1182791957457L604.441185311257,260.923313178438L604.9442839243032,256.42401274033716L605.9772664265171,255.4035352054558L605.3794902222274,253.0702118373896L607.0166461906704,252.61924212600877L609.2769365599308,248.379151554562L609.5324647645846,245.86824619162587L611.105167791651,243.03237431322805L610.5744899474716,239.76194889425392L608.4158983304573,235.91050150858246L609.67732153674,232.3775615605183L605.7949581109103,188.08145482206646L607.2650402762256,189.190872514523L611.4951387068943,188.80130526905316L615.3643092213972,186.25871887955464Z" id="Indiana" class="mapPath"></path><path d="M551.0840683371126,158.13366802712835L553.1492432263587,158.0312797942796L553.4366976657107,160.7951874467674L555.528461107374,162.54069982349188L554.0148643857663,164.8835268889094L554.6751121470313,169.07217465852818L555.8713177678015,171.9980734254683L560.8372813701617,173.8949303652007L561.9413629642941,176.20400854107584L565.1324885259914,179.42313577182279L565.6227596584629,181.35410649843413L568.8151682236714,183.0189060834133L569.3370686771614,185.36032661585068L569.0304322739869,188.99187225884054L567.2914377408687,190.33605512897793L567.0093512190175,193.2436204741307L562.8225818541636,195.86082639099425L557.4790790934576,197.07971279869844L556.7366447599358,200.4217290547425L559.1649018623197,202.97927391617407L559.110683462492,206.28702354125028L557.3695835276986,208.23733683394096L557.1345404535858,211.14168305812814L553.3165619608319,213.39814841153213L553.2498287369635,216.81036386849325L551.6778548748914,216.26546309109187L548.6532291160687,212.5830454380192L547.1966782692566,212.75100303341264L527.2101280477013,213.9938376940513L507.8883023372457,214.61799967981926L491.94469021786847,214.4427535471384L490.32451769765464,211.96977195651243L491.08429531997666,207.12065176566466L489.70249539365153,202.8943847286671L489.77483034842317,198.15186353526917L487.34240211458683,196.5024415397437L486.9658668758374,193.92541652455714L487.8013801174367,191.65918801632938L486.89753073317723,188.36141009429264L485.0134654702323,187.12139136908002L482.56388962967424,178.6683752226753L480.0432330557633,174.53715882188033L481.2544061057259,171.76654527992105L481.7215839194361,168.06607157325527L482.76833375960064,166.73438138105143L481.071410650761,164.87467713468084L481.53454981593404,161.58779725736588L480.8044247335514,160.0419364469335L482.5792398274297,159.6405303416932Z" id="Iowa" class="mapPath"></path><path d="M404.99100327223323,222.88831032176859L498.4935252878671,225.4528895653665L499.9056346357501,227.19666207415435L504.5091081320007,228.59570117877593L501.36975421014967,234.10072748008304L503.1867694330337,235.94105232135712L505.5106971202136,240.35454201074185L508.5856190548517,241.2425029675211L509.09950051692294,281.9319198877722L428.29835082822456,280.7824636417788L399.45150884012435,279.3470321321962L402.8988706018394,222.75650272095072Z" id="Kansas" class="mapPath"></path><path d="M662.6268040277648,237.63454180120243L666.172048875791,239.78001355088293L668.271454520835,238.15040635927164L673.8725549065075,238.85818088174517L675.1877806826668,236.8020833292701L677.1379714951772,235.90730816210225L678.2055526511,238.99131046314028L679.9240594685699,239.27230381360891L682.2477171752763,241.55177062847713L682.6518447417179,247.231982892274L684.8990529191336,250.56359353413598L687.5916063945003,252.99375386095357L688.6163258371168,255.0369019224098L691.7089710925363,256.77664350664725L693.6609939772844,256.80099310462276L688.8223724304896,262.62547684684887L683.863969622299,266.14932434920536L684.0653312603406,267.5810936312413L682.074006390632,269.11091176673676L682.1410792257032,270.76981966419885L679.4299862930895,271.873434758426L678.744860695353,274.0514606759798L671.2061023891675,277.7649503748801L671.0041652145868,278.103672500167L658.3872671909056,279.48125860827815L647.3302756192996,280.152736717426L644.4442834032902,280.68414507845637L628.0368455206715,281.6831700403485L609.4584708949742,283.8186559170962L606.1492524495843,283.2701517490199L606.6766843601283,286.645470538057L588.2282454083145,287.8626955254326L586.4552895195195,288.19380985033604L587.1021150349719,285.76806703232626L589.3509927295738,286.43718132921197L590.016663512827,278.7278305559755L589.216260582398,277.7501324532426L591.232237280129,274.29008261591173L592.906282365004,273.9589470567506L598.5210330462762,276.4289407421762L600.2507791548189,274.73787883408465L598.6875887599064,272.37550023435915L599.0948079517864,270.3747952997236L604.9643571595436,268.13480449573206L603.3302774665126,264.9541939700101L605.023122271465,262.1182791957457L606.2300045524875,260.25406094872574L609.8751341756126,259.731769062862L610.9507771393073,258.2889884678609L612.342955974989,259.51302773500606L614.1971432949942,258.7234680301907L618.1161495845681,261.1624729260179L619.1269531747237,259.0963012226946L622.6072471149,256.8951547151122L623.741682035414,258.65253195711557L626.9307865212274,257.61011739195885L626.486634937497,255.57853815756425L629.4192649339444,252.89394061160942L630.1955984142663,254.99470320258501L633.6318351883278,256.402710311207L635.1684370465721,254.99376479779596L636.0097938040003,250.12558012959198L638.4384904198707,248.92747606363287L639.1266778723378,246.46227440338396L641.3986555750337,244.65165649614494L640.8285915515469,240.97415258555054L644.6129666667771,241.37789788019052L647.0805948100661,239.3257913068329L649.5781974037427,238.9287853801991L647.7999544668684,233.93900708345893L648.7967086331247,232.98975226088749L654.2604672837626,232.33277476945216L657.632019194617,235.870796662408L658.0710746182145,237.48126019186225Z" id="Kentucky" class="mapPath"></path><path d="M525.8688754498158,356.59482332167954L563.8651996605305,355.4587704419341L565.4243693073914,357.54279730935934L564.3581485959027,358.42209456296257L564.3815346889318,362.23283041580703L566.8147159215764,364.47586985303246L567.4501842493764,370.0031073127743L565.7810494666116,374.41332232984814L562.204188732455,377.2683813786325L561.4576417400319,381.52167145534077L559.8787849836539,381.18598242146174L559.9433709096769,388.07022506889757L558.0385305928271,388.36446059249L559.3421599074261,392.00261875661306L558.2692905437998,393.3875569674252L588.3774065620519,391.7043309766641L587.20560435723,397.947831633939L590.1051915673577,401.86650155545385L590.9252543141322,404.89267251263857L592.9932496211733,406.703677293037L588.4026839113308,409.57592592871185L588.1690618266398,411.4380509804432L592.139050769644,412.406527695067L593.615762034088,409.3301227922167L597.1779441892935,412.05835930940896L597.0784886891726,414.425355689138L595.2015316673015,415.58246040196286L591.5073719010852,414.91094404332125L592.0667962753741,416.6168961882139L591.0018444717903,419.35381110447145L594.2706366278691,421.490990418293L599.3016126131405,421.85608680277664L601.2811461473117,424.4804701406996L602.7368876276174,424.7837152469317L600.3798593892642,428.1318276919683L597.4785637153293,427.7236908012801L594.8434793214792,424.6284981988447L588.7595963060257,423.2927140164212L588.5546598511294,420.129326046184L585.6863932415758,421.33721007785743L586.0313723411991,423.97921839985474L584.8472527265018,426.51130584424345L582.7305706404898,427.0509015526312L580.9594748847003,424.3927610097853L577.2110631967068,424.5095561221427L576.0355525643712,427.44299872846307L573.5803782380048,428.3982609904217L570.8082370477584,426.80783689411567L568.6558134678965,426.7158189209787L566.3720634572065,422.2255381116631L562.6257764230716,420.36157882081943L561.2182461986165,420.73565617266263L559.6168623298436,416.91816417504026L555.3825238546665,417.6197315863112L555.1920207580373,415.2718790963778L551.119957245033,417.6961507701616L551.7233538581909,419.4124496824967L548.5894108950002,421.17552088947343L543.5806397466226,420.5430298697677L537.7216010004067,418.1813510372617L533.6063242278506,417.18077014958465L524.8473031301726,418.33291911725064L523.7097967358162,419.075717961632L522.2488600416464,417.26578259014445L525.9008096332133,410.52478937050455L524.5803216731765,406.9698181437452L525.6784090571157,404.99604917933766L525.0892712958672,402.44702142217784L526.6217681799997,400.46108841998296L528.1630457704014,395.60000733187087L527.7972699646052,391.6066162704042L523.2619645926341,384.11815782697613L523.0810401168004,380.01253180060905L519.5344510153614,375.97856959301816L519.1380736476037,356.74889194761295Z" id="Louisiana" class="mapPath"></path><path d="M827.9093598627953,122.56750954129132L825.9815015224099,121.70635120992563L825.7116263236262,119.86187719648967L823.0740573851309,118.33902795400115L815.8186519870349,94.7785297846508L812.0552088411744,83.27528959775634L816.8637931936526,79.3230781737592L815.6143350721428,78.28562193175242L816.9312054572508,74.9573969221916L818.7147958476694,73.08809853279092L818.002671311342,72.11836669203933L819.5327552224815,69.892526518247L818.0418720013818,66.9140781130659L817.9615342440825,61.85143050300951L819.430961960895,59.74666752022381L818.7749230183782,54.53017256853764L824.3607872137599,38.121444084905875L826.7366674938328,38.06650369936301L827.8382155631964,41.34675307642851L829.7899639838681,42.04808872897547L833.1661883325253,38.93109083980164L835.6403263165691,38.19391535197565L836.9972100207497,36.406732891655906L841.2574550488133,38.20012593291824L843.9766713246245,39.92435820617277L850.2268748663712,59.873367564678574L851.4184636524786,64.74532680449136L856.1170312939298,64.69020190481422L856.1358827505888,66.93246746880607L857.8378328049628,68.54731429236006L857.4902668143277,70.58320967379586L860.1274725211658,72.7661756071276L862.2837534478638,71.44986014624726L866.5535896835393,77.08665629163727L864.8145732992167,80.74786916107348L862.9544609214909,80.14728168703891L862.3149895562397,82.49290296944264L860.3590190527565,82.56159668578573L860.6644798309928,84.29131071667621L858.2405874555205,84.82177462013658L855.6433917258256,89.79397412787421L853.9348623417378,87.4176151337856L852.5515591613564,87.62042730830149L854.0372007728611,90.27930237091971L851.5136738579572,92.53621385434985L850.1396425485584,90.4840347178723L849.0925573772829,92.07985460627265L845.8034759135304,93.05159570671151L844.952553158934,90.41519559423227L843.1686730585286,91.5791447334916L844.0653323575071,93.34744749831123L843.3905054659572,97.81960196174202L844.057516977476,98.80136107065391L842.2924108997593,101.66503079676954L839.6680535862697,101.56604588354764L838.9065030438351,104.2405030764229L837.0118926236667,105.10040128929177L835.9159088271708,107.43889469720375L833.8209500324579,107.60205545221504L832.6998711979578,105.78326079744261L830.6778952661161,109.7594219681389L832.0095659151654,111.52180697603592L830.0685649334637,112.80675641452797L830.391679464848,114.52992962568919L828.5396131061042,117.27866629565642Z" id="Maine" class="mapPath"></path><path d="M778.2328899842199,233.52100387369728L777.9204665057138,233.58771572994112L777.5299155467233,233.67100427607943ZM722.6066303114933,210.3678108515454L774.1594166568768,200.27900751323045L780.4903966928828,223.20925784452993L789.6747984520628,221.3953547758042L788.6105991279453,229.78100947231098L786.4959916502507,230.56583950810284L782.8392833112385,232.52865347059196L779.9683338412683,233.99421888963832L779.395389214076,230.9479948341326L777.966579023814,229.98680539431643L779.3196566632578,228.32305497972118L776.4935624591097,225.7600803022466L776.074393081097,227.2224020955473L773.0556935894117,227.54535734243723L771.3443482585336,224.42241385336354L772.2752219919507,224.2266149040039L771.4369171028547,219.86470010726828L772.0013767512837,217.95114327659303L769.5320799883036,212.3506796765812L770.3423541006334,208.59139192864893L772.5891549953388,207.48020453118022L772.2163078989824,203.86453541332764L770.5448343365053,204.64315877940817L770.8545996545738,206.4773014048335L767.6664625773756,209.5771144788223L767.0352878242654,211.924477640923L767.9220112796127,217.3304827901594L767.0572410783179,220.1474475140111L768.558945031159,224.2658441506286L771.0341556775229,226.8090797779273L771.2662776588502,229.08200119346805L772.9010855414163,231.06096594076598L772.5952233576267,232.70820052030308L768.7086074721603,230.45834773410888L763.7430184224472,230.0015824626655L761.7669443059742,227.45171841105548L759.4474726430453,229.60454934936968L757.9902479375937,227.5787338771854L759.5190179546311,224.3230113953888L760.1665752816764,221.13705500311994L761.6321788654304,218.83751529911137L759.4865657257926,217.37613884048994L758.5530790122256,218.7233567751423L756.3547039605814,217.37380961963095L753.2413245958744,217.04502484492946L752.700805407474,214.30979543078354L750.8621852130082,213.0933787893115L748.6487133878372,213.21066422239812L746.0326426510788,208.35446484267106L743.6559966988866,208.81210976226419L740.9512967156436,207.54120926014048L739.9169727182452,209.20798912642795L737.5965508659625,209.53888248331248L737.4381816871266,211.6690519992352L733.0453654309247,211.11654105474054L730.776635607975,214.36367111636412L728.8188215574652,214.08750905171917L726.6067096704143,217.73436477762266L724.1306553769225,219.95409220370095Z" id="Maryland" class="mapPath"></path><path d="M825.9436025531822,126.40499202647834L827.318985280742,126.3523273100642L828.6858765972738,129.39288789870045L828.8095594103561,132.13203405746435L827.3563147667395,135.08416198861005L828.0338155679298,137.88735470243478L831.0446619225052,137.49919959455065L833.5735614171895,139.90542476930466L833.9069124217974,142.27036385376698L835.527121100198,142.46771760846968L836.2455048036095,144.5141858545751L840.4618689795032,145.2743777800822L844.2935208663473,142.3846684618361L844.0421121434977,145.1311525767826L838.2872497877745,149.08308007619564L835.9702198640917,149.82506728606597L834.1179176282803,148.51385812011233L832.0556281591971,149.60664317841122L832.3316495706333,150.9199926499989L830.0507210694537,152.38738895283473L828.1450719500249,149.3763741858245L827.619423863548,148.87672296963274L825.8840878803776,147.95235291358426L824.017679172141,143.86414848058996L822.0479785671416,144.384397707291L818.5231883265835,145.52009904895476L818.4453477782895,145.22103075217456L801.6228578416598,149.16244649142402L795.7851846764491,150.37374695600272L795.3228907359628,149.7435991929392L795.619243356459,136.95970963921138L806.4193633383201,134.59531310922443L821.9032770038029,131.21637261639842L822.8956841183735,129.14149387854673Z" id="Massachusetts" class="mapPath"></path><path d="M661.701296709542,181.4586791094223L643.2187173061357,184.50590378953973L643.0734264228732,183.27789363826844L626.8169993665525,185.09874278927475L615.3643092213972,186.25871887955464L617.9094097300613,183.52476893722496L619.3676182169961,179.13492427913604L620.8310249743467,176.39914121355548L621.7342537639026,172.68432204329554L621.9510013563219,167.48848131440627L621.0838102716306,161.99317285452332L616.0039211115404,151.55664645488355L616.8384637657762,147.34334467913175L615.4689911710761,142.52824464360344L618.0148731280123,137.21613010142846L618.2359428910431,132.96650409691836L617.5712153433724,130.76784504096577L619.6404581504133,129.62571211801844L619.6082470364021,126.53837975303009L622.9011561562756,125.36436684232115L625.1195825046639,121.72392225916803L625.6408478885892,128.4676984749625L627.0435213784262,128.6225446467149L628.3962277469451,125.06988540311886L627.8291488424676,119.36341402740061L628.7410820711389,117.81890493944661L632.206234689831,116.49532359616842L630.6087170915504,112.66395530590114L632.5642729535505,109.04088311341172L635.447782033653,108.4944773924617L638.9685401545025,110.23189533332527L642.2008927064823,110.14235235313254L644.0947986163785,112.58473252556519L646.5390125637539,112.48074429670896L650.9119724651606,114.38993461224015L652.3231834662756,114.10068033124094L655.061869431066,117.76253037305992L653.5588943718404,120.13255034596443L655.6441852554715,122.64430574132359L656.7136544349065,125.70563779072802L656.8492822196704,132.72248747295976L654.4020518357811,134.80729721764226L654.2181193393386,138.45427442276412L651.1794307169394,140.09171517578113L649.9789730565456,144.59338733284335L650.8442647680574,146.1397274007022L654.2581019637497,147.25247608281438L656.4339585387045,144.58328311034666L658.7077529633128,139.41009216994678L663.0319217121577,136.9541997685335L665.4800583384904,138.06382431606016L667.2333041145259,140.51264387380456L669.7173567138389,148.04569736478106L670.4889063232956,151.88127707929493L672.630663973556,156.35302014553315L672.1911373990963,163.27612096556584L670.1129629736537,164.6106384158628L669.6939901801868,162.1752647330169L668.3137818860939,163.09649021700682L667.3870986518072,168.94147781882975L664.9265963079911,171.46216072925654L664.6882078660167,175.86015249650677L661.7229088826208,179.8965929882993ZM625.2413252164765,110.38913483830322L625.7025145616117,112.60091304239825L624.0397195779444,113.19584750308479L624.4042409747852,109.96749107684116ZM599.276685280689,124.90529840976376L597.0961284786864,123.1442995259905L598.0822108321152,120.38676752100048L594.9688691295368,120.24628531117037L595.9650086773729,117.59356228117736L595.8252391296415,114.32119249478637L592.9287718658505,112.31215635507658L591.2402071960104,110.09543282864774L585.5575813668067,108.71113480976283L583.9028972122518,109.45495630080791L578.1672775321603,107.1207460551816L564.6147932905567,104.2491968069537L563.009789802566,101.17964764470298L560.5475680906151,100.20326853600352L565.4251689691114,97.96592211732923L567.5294381257249,95.58514716234754L573.0774433262111,94.29395957245458L576.5225974038143,91.29308646846175L578.1927816013805,91.0688751494514L579.4460064904231,89.03622696561536L583.2084148400407,85.99267777287844L585.040287052679,83.50134929647959L587.9013830664718,81.73907690457588L590.8564286175853,82.81807621297276L586.3154048345754,88.91002748916844L585.2828856256862,90.93321783793965L585.6279959597609,94.37962726074909L587.8649676331052,91.54205554325245L592.3040350226454,91.57978376034623L595.8910692339318,93.10864861437256L599.4321404407387,97.90804290371238L601.2032309424019,98.66758426503145L604.3610426305253,97.55280321333987L605.2406304056867,98.59589214535856L608.5351072624525,98.89161585493571L614.9844028599223,93.93572692593966L618.5135599318569,93.15386644729313L623.2959712894799,92.83830349974278L626.3543939346143,91.05954036265575L628.7886939659056,90.67813859717592L629.8767145867988,95.78577676239354L632.4861088657238,96.19921919764181L634.9152749566989,95.08814727015954L636.1142013201621,96.17631941307832L637.6126250328449,94.45270539921887L641.2631180938772,93.48621270109538L642.1470331065927,99.95609962723177L644.1840476207494,102.47748541077738L646.8151342553542,102.86123955789787L646.8615795870012,101.00173178078148L649.3275753069854,100.68017109135155L650.920933952335,102.42705727785733L649.978679248865,103.99402961346857L642.7592041930975,103.68702728108462L639.468504816203,104.9196601066792L635.5243445274295,103.13501097668086L634.7068602933882,105.28991181784045L635.4078066418256,106.95547861898808L633.7311225751546,106.74300338037006L631.0292234098793,104.48806851407585L626.6875595296224,103.44284486219487L624.5578713921877,103.5781459653673L622.775940118889,106.24008807091832L619.4433989974625,107.21581075629933L615.7074110443297,107.0941487835421L614.3239628490069,108.26325723352397L614.1766453006562,110.33250570317898L610.2991363255064,112.4673369131799L610.2715297601017,110.00523415103169L608.4473014852599,109.67066027853423L607.9835074394078,112.28255262590517L605.0058457104963,112.66950169439838L603.7584339777792,113.91581894427168L602.1651383368202,118.47923323228645L598.9441775132473,124.42082551548776ZM579.2630628666423,72.74572846603235L576.2665201484674,75.30929165020927L574.6325823524141,75.73302458493788L574.6323050031331,73.79992193084365L582.2121907281589,68.85653393028917L580.9370280896107,72.00712916262432Z" id="Michigan" class="mapPath"></path><path d="M539.8687220837581,98.69375074374716L538.8505205385316,97.92012100232012L536.3093025139531,99.55184191622152L536.7388164715592,110.56157421579371L536.0006979252136,111.71431201494636L532.358294716608,113.38182540641355L529.4998757944844,117.46713573489012L529.3727186496271,120.1309941411863L530.882586951505,120.28520605938093L532.6118663286885,122.57915981583312L531.203580489924,125.49472239424972L531.5999957412209,128.65630748192768L530.893593056439,135.5473376058585L534.494278129575,138.80607263036177L537.2665311509214,139.0100215217799L538.7282297468585,141.00528187222164L542.8910561957204,142.88661458248316L543.6537397667511,145.3183088527718L547.5980169527504,148.3259292791647L549.7550528087478,148.94339164667178L552.5234596858851,152.91966267719692L552.3043536488835,155.9131951831498L553.1492432263587,158.0312797942796L551.0840683371126,158.13366802712835L482.5792398274297,159.6405303416932L482.73887156174135,126.00132023636911L479.7341794923738,123.83461836192771L477.4694140189821,120.23640250225935L481.07263714811177,116.27692164701068L481.3706824871805,114.13303283154062L480.9190770525838,106.67723187655065L479.3763031605228,104.7281854866983L478.35047074774894,100.64131245722353L478.60304851990355,95.65104134816829L478.11900667085996,94.83229896248599L477.8055463233033,82.92945572065628L475.3760307108513,76.61029639751621L474.4513903883102,73.04980382545284L474.12997539696664,65.54940419055413L474.9802752443245,63.02975428730997L473.4173951788225,57.147323002906205L499.1680344703376,57.19903456009513L499.10507403463,50.13444672066248L501.53853962283597,50.311928620831964L503.17709158578697,51.7049425519707L504.9320370706891,61.27756786769794L506.2439161937942,62.37132121301022L510.34379395925737,62.60682825169317L510.8385944806443,63.50823124295016L515.6290269072641,63.81371485116233L516.2225779440654,65.82462482747371L520.3152783232345,65.21631327083344L520.2936956442585,64.40696932213052L523.4766784181098,63.305568687688265L526.2894916257834,63.62450178141489L529.5523127298163,65.0352922993219L530.509092714165,66.92663104751944L532.3511902163908,66.65770214886243L534.2218839420769,70.74380968071796L534.9795931653881,68.99074874296002L538.1024015379887,68.0540952894338L538.7232283435334,69.7519227013106L542.4857649666219,70.8052349400283L542.558892487193,72.42556130886214L544.478441977739,73.65708945667745L548.2317997630734,72.76518158430724L550.409035096804,70.82725466053262L553.4410390635189,69.54989595780512L554.6906121157434,72.22247273445441L556.7888812427215,71.4952333247611L559.3690372868602,71.95456462933623L562.3019277107351,71.37087357742905L565.8210859659978,73.48592086746146L569.0309681937993,72.86771636279491L568.8234377591189,73.89836902580862L564.767704374786,76.50210721707231L559.0040498214794,78.68480664258175L555.305536878125,80.82845043027578L550.072419656925,85.88983431939437L547.8500617777705,88.95381392884406L544.3755643978478,92.4805475413134L538.8211981556892,97.2075094907151Z" id="Minnesota" class="mapPath"></path><path d="M602.7449359147271,315.3400390570382L606.8025548680392,315.0121749862352L608.5384133625773,316.83508354900266L608.0640939965136,337.56291279807067L607.3571997120409,373.4427596390018L610.8520997538458,401.88531814066005L609.1604967742107,402.8423164243942L605.2630093475533,402.73428296260056L603.5890687373278,401.62821680428783L599.7855141791318,402.73235881202606L594.5746222856835,405.2600244738861L592.9932496211733,406.703677293037L590.9252543141322,404.89267251263857L590.1051915673577,401.86650155545385L587.20560435723,397.947831633939L588.3774065620519,391.7043309766641L558.2692905437998,393.3875569674252L559.3421599074261,392.00261875661306L558.0385305928271,388.36446059249L559.9433709096769,388.07022506889757L559.8787849836539,381.18598242146174L561.4576417400319,381.52167145534077L562.204188732455,377.2683813786325L565.7810494666116,374.41332232984814L567.4501842493764,370.0031073127743L566.8147159215764,364.47586985303246L564.3815346889318,362.23283041580703L564.3581485959027,358.42209456296257L565.4243693073914,357.54279730935934L563.8651996605305,355.4587704419341L564.9240784042305,352.8275914746521L563.8744699525071,348.963851493236L565.1502127355644,347.351254921449L562.3169156069698,345.0210518214153L564.4691689628738,339.13441955549536L567.0867357409237,336.00348907002683L566.0532034211765,333.99450668746044L569.0700113848716,330.7338644467851L568.9180139991823,329.50327486526817L571.6189090308876,328.3187107234161L571.1568415091624,324.62702393729444L572.6926264873784,323.71224250446005L573.587570790335,320.4572637012269L575.9104268366331,318.87191425596586L574.8984533346297,317.2794429192594Z" id="Mississippi" class="mapPath"></path><path d="M547.1966782692566,212.75100303341264L548.6532291160687,212.5830454380192L551.6778548748914,216.26546309109187L553.2498287369635,216.81036386849325L552.1423965462385,219.54942004466955L552.4779551532781,223.35652052517798L554.5423751541298,229.04454090257627L559.1533650728968,233.67074505523203L564.1410022108578,237.43530603328668L565.4287485961272,243.56894000133093L566.594955940205,244.64072717819442L568.1464216593155,242.79276533395205L571.3416499312596,243.4305702860106L573.4702562289197,244.64512327734155L572.1912072998074,247.00020830408164L572.6930395826913,248.7285254744868L570.5329590364203,253.72212498824058L570.6314805255051,256.71682124909285L575.1595364897544,260.2692163561667L576.9100617959747,262.6424859059646L578.4788732431662,262.12757173042314L583.4582248394572,265.83302451075633L583.6553304439541,268.71828864927136L585.1067583810403,272.24195556935126L583.9861778979346,273.5612878969372L587.6614259227118,278.68922048268337L590.016663512827,278.7278305559755L589.3509927295738,286.43718132921197L587.1021150349719,285.76806703232626L586.4552895195195,288.19380985033604L585.4802266506815,288.26109830332973L584.6676265102861,288.3166577854802L585.0647534963482,292.94659960291494L582.4425701964611,297.8821101004751L572.7866666992284,298.4869852606598L574.9467261589,294.8409150489317L577.0906913013936,292.4329346311764L575.5644933585312,288.9069205416637L511.3535707801563,291.2956526874125L509.2363105372694,291.32806693141276L509.09950051692294,281.9319198877722L508.5856190548517,241.2425029675211L505.5106971202136,240.35454201074185L503.1867694330337,235.94105232135712L501.36975421014967,234.10072748008304L504.5091081320007,228.59570117877593L499.9056346357501,227.19666207415435L498.4935252878671,225.4528895653665L494.97647348921134,220.51990352864323L491.94469021786847,214.4427535471384L507.8883023372457,214.61799967981926L527.2101280477013,213.9938376940513Z" id="Missouri" class="mapPath"></path><path d="M388.9445180510233,53.02176010643723L387.232227196119,74.01380071928611L384.14897664882676,109.52299545522192L382.7243905932953,127.16163282928801L382.50846759652615,127.14330010231527L358.1420951571532,124.72957772776522L316.7021466791289,119.69173111652776L290.9852989773508,115.85753522360108L289.50553423066026,125.58425883168934L287.444537746396,123.28006692751421L285.89275005016526,119.70492916478463L282.2513470097533,123.0532524959001L279.47862057186137,123.31816123783801L279.0032631678432,122.19844116901663L275.78301138926884,122.4836107121406L274.1475435124985,121.2663113426861L270.8566355906513,122.35948321154137L266.7890778905771,121.53640931268126L265.11972623322185,123.00874110963048L263.795951740789,121.72806799362525L263.16075895699794,115.46553494651039L260.4890967455503,114.76723020909071L259.2735119374605,112.97912733778571L259.9992290922977,109.46765378861141L258.68311017493477,107.86835611282334L257.2602283750659,103.74750196152274L256.6570626642181,99.98908784837658L257.2948425338599,98.54877126120243L255.32075159721063,96.29916290974177L253.6705751568065,98.06435885235169L250.01783242262607,99.96033452477354L247.64940574099592,97.51449631951937L248.67731041861927,95.63296502725836L248.1423672827842,93.54764134645029L250.84696244080737,91.99720855993826L250.07107142265778,88.92993603709738L251.26741816733153,84.69140980706936L254.4041025563694,78.23877470968444L250.72015641666627,77.61770772335638L250.82004138849402,76.39062781166012L247.88881126318543,73.83029950208731L247.74070429621509,71.72231369172073L244.071595612715,65.88385736507792L244.06487220581465,64.53219512544149L241.70192456647587,63.21141060596858L239.77309694789233,60.52193843698933L240.75173023367216,55.5362757710526L237.83403252580308,49.62479993859699L241.797560686922,31.113549917192017L297.18701905863225,41.697470276835816L322.3201832385753,45.45356006346094Z" id="Montana" class="mapPath"></path><path d="M389.279279401805,165.17905735580428L412.27893875972,166.85162362218273L454.7157984675425,168.66688164477307L455.1379793586266,169.60394273755685L462.06418632104965,173.16083771057538L463.74163628523013,171.34192532600343L465.6718654006104,171.78926228422768L472.0830593831379,171.8873025690168L479.214737230148,175.45759049198352L480.09420203395257,178.1397514019875L482.56388962967424,178.6683752226753L485.0134654702323,187.12139136908002L486.89753073317723,188.36141009429264L487.8013801174367,191.65918801632938L486.9658668758374,193.92541652455714L487.34240211458683,196.5024415397437L489.77483034842317,198.15186353526917L489.70249539365153,202.8943847286671L491.08429531997666,207.12065176566466L490.32451769765464,211.96977195651243L491.94469021786847,214.4427535471384L494.97647348921134,220.51990352864323L498.4935252878671,225.4528895653665L404.99100327223323,222.88831032176859L402.8988706018394,222.75650272095072L404.1007452758222,203.91320832831218L376.23661495224616,201.84152269558513L379.4183703053286,164.37958890380935Z" id="Nebraska" class="mapPath"></path><path d="M201.25851104669152,155.9241546144723L241.5033802898587,164.41986129692418L223.6615221381652,256.84367072628766L220.79637044619994,271.74984886400387L218.66318754678042,274.59787507392844L217.19516688373642,274.4184011448298L215.86155805723484,271.84426124028835L210.34118081765644,271.4892704799853L209.06791360796848,282.49712991338504L209.57973815938954,286.2810562962321L209.22311636788004,289.78656760153456L207.82595407529573,292.1388077019052L193.5478120720827,270.5619714879522L185.59322436408132,258.6009647189593L174.7219733035521,242.29098223694416L161.23352433545608,222.00704387441567L147.29790160877542,201.0492552389229L153.33147788304342,177.97691479588002L161.39805566877646,146.4068850877651L178.79769928195634,150.87592564813747Z" id="Nevada" class="mapPath"></path><path d="M812.0552088411744,83.27528959775634L815.8186519870349,94.7785297846508L823.0740573851309,118.33902795400115L825.7116263236262,119.86187719648967L825.9815015224099,121.70635120992563L827.9093598627953,122.56750954129132L827.318985280742,126.3523273100642L825.9436025531822,126.40499202647834L822.8956841183735,129.14149387854673L821.9032770038029,131.21637261639842L806.4193633383201,134.59531310922443L804.9088802960246,133.4908770701809L804.3747000399563,130.76105791283658L805.2771653468587,129.47230109842894L804.4773617569012,126.91657829780127L803.5379849860215,118.99001502379724L804.9093232825614,114.82446208605302L805.0026047339218,110.45464336461407L805.7544271252391,108.67144336137153L804.5315157066751,104.21822740309767L808.3983502475169,101.41326710123053L809.7033859481621,97.78462759210754L807.7285846726106,95.12405869154384L808.6976136495032,91.69093842042992L808.0878053473893,89.94503562417799L808.6695201787034,84.81402666286726L811.7213857332968,84.53031401329565Z" id="NewHampshire" class="mapPath"></path><path d="M789.6154614545178,169.42075005287245L794.770346416917,170.96399963689464L794.3839996176479,176.67234910941715L792.4203608149276,178.40443904556537L791.8760045753061,181.49768080337662L795.9613873392157,182.02467128651472L796.7595294026873,184.06292889861277L797.4139146121875,194.3002583215772L794.7864511068556,202.65055972616187L792.4455612797915,205.4139977407374L790.9720822266382,210.62172088877412L788.9841179713537,207.89536639369533L784.5849038882175,207.29449858661394L778.7218890914448,204.35878165701774L777.8211911439412,201.70221181800514L777.6567985922637,201.31541399350203L778.1983502311846,200.1401574169546L779.0051836000212,197.63780618908459L782.3927184716545,195.30141933746268L782.3056096499913,193.84018733595508L785.865551901261,189.86584091194936L786.1800702150525,188.101241815599L781.4189657717166,185.26098883952523L780.7499034711038,182.9788772975935L778.885828025929,182.7605826439525L778.2652377091888,180.67913615882503L779.6448494974966,176.98906078467462L778.0952932849048,175.3274507565568L780.6692193418417,170.73326538451477L780.958437266529,168.55357624016438L782.4448844973772,166.84135255489866Z" id="NewJersey" class="mapPath"></path><path d="M320.3585440453609,271.95616019009526L328.46167790672683,273.0146953899831L365.64912638481337,276.7848684187272L385.3337202389477,278.27318182722263L384.64210032332505,287.64483899869947L384.0735485137171,287.6027650853166L380.5234362661584,334.3078663259595L378.7723010093344,353.28440612828456L377.3740271007042,372.05459154454115L321.6807175770955,366.85857009105825L321.0450827845674,368.6486014414984L322.6103482186883,370.9948145380671L296.2280135526869,367.8237681871128L295.1359699251489,376.2774975982751L281.93524394378124,374.51304338716216L296.61007318217173,268.88279274345723Z" id="NewMexico" class="mapPath"></path><path d="M784.5667021336577,95.90232792114898L785.6266605882113,99.65077810575053L785.7439742539027,103.20821208576353L787.7445969405037,106.20414276021415L788.2393176496372,109.778800717855L787.6416479385122,113.83101224807592L789.9927450615431,118.54350487908209L789.6407747445776,120.21430133724823L792.4468684174865,122.70382096071171L795.0843376850465,135.3956643504913L795.619243356459,136.95970963921138L795.3228907359628,149.7435991929392L795.7851846764491,150.37374695600272L798.2331620708501,164.41252618558553L799.5596631391346,165.6836272381604L796.6987796247456,168.49146160594648L798.1697755933712,170.36646080933917L804.3419354951805,170.46510937212804L805.263066678699,169.0716098874417L810.2447684298875,167.83961569409485L812.6200770804162,166.6069535153813L816.0376065508033,162.65683673234264L816.869003025039,164.6797051617831L819.2494347385714,165.02842438343066L814.9610038975844,168.99507884862032L805.4408341251063,175.6122996939814L801.220844856243,177.4842892009824L798.2521727683961,177.98272142891255L796.2931946195979,179.40194441517644L794.3839996176479,176.67234910941715L794.770346416917,170.96399963689464L789.6154614545178,169.42075005287245L782.4448844973772,166.84135255489866L781.5534817759367,165.6698660518441L779.4529977645009,166.04024057021945L776.3055623413054,163.47271328172894L775.9935288431057,160.6912218320765L773.8969917877428,158.94241793255947L772.8859406318129,159.27270290371905L770.8543193115938,157.08440641845186L711.3191890419313,168.78165697614475L710.5137295735705,164.1129072381376L710.461212382511,163.80849760409535L717.8099793436342,157.08068038193323L718.6800156957402,154.31016122936535L721.0130377388246,152.1093484230671L719.4155058309551,149.1585246048934L718.2070752998644,148.75018445510636L716.4907429236533,143.83522378032376L723.8948778882818,140.28425434944063L730.8200759577658,139.07851504753114L733.6786401374969,139.04970413491083L737.0539447602121,140.48461878617616L738.7849460092259,139.30431437428967L744.5440198335909,138.25332640085105L747.7589151715265,136.2318209814298L750.7612333350696,132.14517386513L753.124164640892,131.54394271458614L752.1356865386522,126.50311740786219L752.7406821006982,123.33145677390348L749.3768684352507,121.94253390081315L749.5364364559007,119.49722426646372L754.0888001732319,115.27920664096837L755.4281922477198,112.15825891642714L760.3302729704278,104.68521819629609L765.4919571752735,100.27482052550852L774.3341771755312,98.76410921309969Z" id="NewYork" class="mapPath"></path><path d="M710.9223090175132,272.7414607956309L721.0128204165634,271.4098542652855L732.5035835663662,269.5495909788011L785.5873044519724,258.9841607876332L788.851528302955,265.99060308452226L784.6208450884334,266.16004700853114L784.2543436705791,267.1881280183633L779.5221792656591,269.3469130442842L779.0113835452162,270.5081747119175L775.7834569732744,271.49359097892454L776.2150422896859,272.77482427994426L780.041861735563,271.0311377986893L780.7731226281683,271.72175110461353L784.9949106510328,269.88023740558276L786.8055660383088,271.2881084404519L789.3016898204334,270.01234826142297L791.2260368966458,274.24268938418686L790.7987398396976,276.5526665299519L789.0690206851226,277.13638709960367L786.3225170296656,282.47053928951414L781.4264065543128,283.7102259264432L781.2668267638873,287.0103257983768L784.0323299198437,289.7005645823929L785.8677682574946,289.9477406781573L783.7662107322332,295.76180984862526L780.944961072657,295.7144090637688L776.3079397143956,297.1887520299533L773.2590891408104,298.9602748630065L768.7951254856102,303.52526397112024L765.5881907027697,308.98213763696424L764.5711353338336,315.2655192068381L761.1738807734208,314.55018378091256L755.9348011435773,316.79194300048187L735.689638726173,302.2037932998436L718.8010075799923,304.71710582820094L718.7022727290258,302.5389517948761L715.898955777065,299.7504451869712L714.5202394825915,301.1191546644976L714.1310720015858,299.1962420617888L695.5542987837498,301.0812415217662L691.5554869512612,302.38642862071924L688.5976504536507,304.57567063801287L683.5852647255116,306.51867033142537L675.9679149412508,307.8496403899686L665.4048252319898,309.0899507325836L665.2720189039958,304.63644593180675L668.1793205516119,303.85751354412525L668.9402444730058,300.64126629967154L672.2708477516823,297.40573553621743L676.3457681660607,296.7685011089143L679.637322483721,293.4131834198648L683.3288746562353,291.8682666692057L685.9999891978578,287.22455095588145L687.856139381391,285.71224185755386L688.5225902345138,287.4945353250482L693.846059392758,283.0779305122337L696.6231251339184,283.40008567908785L697.9669261279956,279.65151150023496L700.5733540608838,278.3199591075713L700.5523777232653,273.8324977508347Z" id="NorthCarolina" class="mapPath"></path><path d="M473.4173951788225,57.147323002906205L474.9802752443245,63.02975428730997L474.12997539696664,65.54940419055413L474.4513903883102,73.04980382545284L475.3760307108513,76.61029639751621L477.8055463233033,82.92945572065628L478.11900667085996,94.83229896248599L478.60304851990355,95.65104134816829L478.35047074774894,100.64131245722353L479.3763031605228,104.7281854866983L480.9190770525838,106.67723187655065L481.3706824871805,114.13303283154062L384.14897664882676,109.52299545522192L387.232227196119,74.01380071928611L388.9445180510233,53.02176010643723Z" id="NorthDakota" class="mapPath"></path><path d="M701.115674416374,170.91807049844567L705.2118275682193,195.84241377032617L703.3271356207191,197.19604551208715L704.6481995947611,199.07136815181366L705.0381632087795,201.93524094904342L703.8569439238516,206.72814334824898L703.6544774097572,213.7664809124741L699.1316693938319,220.65286733037522L697.4790240094156,221.74688844494426L695.7415127451995,220.762085031948L694.5226758468642,223.66546742664082L692.878789923962,223.81151367307712L691.6326550523587,227.65498559814773L692.3446437191681,229.74086881840378L691.1244192216666,231.69937091351665L688.5949106983505,229.1523070786094L686.603999668607,234.03775679371358L687.7263868546731,236.79613239279706L686.15223285207,238.06948042905378L685.9589217403302,240.60221576683455L682.2477171752763,241.55177062847713L679.9240594685699,239.27230381360891L678.2055526511,238.99131046314028L677.1379714951772,235.90730816210225L675.1877806826668,236.8020833292701L673.8725549065075,238.85818088174517L668.271454520835,238.15040635927164L666.172048875791,239.78001355088293L662.6268040277648,237.63454180120243L658.0710746182145,237.48126019186225L657.632019194617,235.870796662408L654.2604672837626,232.33277476945216L648.7967086331247,232.98975226088749L645.9365916539571,206.8213951955048L643.2187173061357,184.50590378953973L661.701296709542,181.4586791094223L667.3816930500366,183.29236932435174L669.398394866649,184.57541186069363L670.5541530358491,182.95807294261454L673.9807852218191,185.49493266692434L675.9955164040241,186.14502657385606L682.0372011430593,182.76447647082546L685.8723418381785,182.71148912963463L689.3962620436689,178.6282277604313L694.7803736886689,174.34267600357782L701.115674416374,170.91807049844567Z" id="Ohio" class="mapPath"></path><path d="M428.29835082822456,280.7824636417788L509.09950051692294,281.9319198877722L509.2363105372694,291.32806693141276L512.3494540907443,312.13371750365127L512.0507371055172,345.24062095280385L506.1081544387754,343.26278888657L504.5649361924287,341.1165257290804L500.5874879445952,339.29947212523496L499.5894238877871,340.95606650577463L495.62707801303,340.87726008813115L494.7798580677321,339.8505969227964L491.1611116759782,341.7160381392126L489.64233546193043,340.6874337477997L486.3540028871761,341.61331906943644L483.30752567368404,344.4901492620993L482.1319087319933,342.83698339216744L478.93354670228064,341.47977034657265L475.5605982816944,341.45346240623996L474.4854020353682,339.2793941254814L470.5601801437338,343.4609435496495L469.32493051512415,341.0752034972047L467.5442312082222,341.77193090360595L466.2185048984929,340.20641876595494L462.6214968436176,338.7038403338786L459.8796416978007,341.1259848710388L458.7521483013877,338.526652090428L456.57096061868975,338.1711255884426L455.3560447592738,336.0821208647767L452.43614398021055,335.1876589553128L450.4591968310773,336.88993484149364L449.2401252561766,335.31091653421186L446.2113308967687,335.43206175469504L442.9042293664281,333.6819401927381L439.7940430543678,333.78711995759613L438.8273691839701,330.1440733866507L433.98250517943876,329.7633505497066L432.1181959061072,330.31100123627687L428.8363701509594,326.5676617574044L427.6592055307538,326.72498027889435L429.1962221992817,290.2263434056613L402.2749496219448,288.8353295620468L384.64210032332505,287.64483899869947L385.3337202389477,278.27318182722263L399.45150884012435,279.3470321321962Z" id="Oklahoma" class="mapPath"></path><path d="M140.87563533233254,59.53232332006769L142.0905751068957,59.67654920007055L144.20496457485297,62.315051578332486L144.73970467462414,64.80996926389741L143.7933655995643,70.38742067727264L149.6988085708034,74.20553951904844L156.0115175902897,72.8990024546647L159.53665517916937,73.55683429023588L163.26574833409933,75.63667217876605L163.35848350728804,76.93319522440186L170.95313534081936,76.21861784361352L172.37578289828457,77.54643144311183L176.23829690130538,78.03020762744666L179.80971863982313,77.0548387831775L185.7404415546149,76.88092398471349L190.88414275622978,77.74799014745315L192.9062170795401,76.98566723040403L219.06525348440363,83.24269162905694L220.114641147834,86.72148843795276L222.82515831661624,88.68088638125948L223.32557518483674,91.40693412224641L219.47755023951981,96.21658095297437L217.99668084776,99.24346916330535L216.02905707292024,101.11376231314512L215.86190048891217,102.86041200189584L213.91678283820596,105.26040939042298L212.43842004627783,105.5587240055836L208.34506922186074,111.46531342925402L208.7025249824854,114.1761565967372L211.1286061987301,115.03862420660266L211.86215636622916,116.78017219992978L208.79776218799992,122.40545042484473L201.25851104669152,155.9241546144723L178.79769928195634,150.87592564813747L161.39805566877646,146.4068850877651L147.60502967795878,142.767446341986L129.8703167619954,137.5292559446351L118.53469178773884,134.35184862301298L105.56695748299899,130.5657586170738L104.32677248684297,127.92285508629993L105.10912071768871,121.80689250655234L106.56713709815187,117.84031918256949L105.75599802372761,114.14337359346814L107.94839940871697,111.5911428371777L110.35493818645875,107.06042666812311L113.83186652548807,102.53728472647083L116.05870983829772,98.27696318111714L122.09249177599742,83.49026847602579L122.51071903768974,81.3678246729637L125.77978915553052,75.08149027249044L129.04919143530054,66.02329983232482L129.90745026458012,60.73058715147033L131.43833569339546,57.886404773787945L137.19181102494866,56.73751928236118L138.75692487352399,59.4388966153175Z" id="Oregon" class="mapPath"></path><path d="M710.5137295735705,164.1129072381376L711.3191890419313,168.78165697614475L770.8543193115938,157.08440641845186L772.8859406318129,159.27270290371905L773.8969917877428,158.94241793255947L775.9935288431057,160.6912218320765L776.3055623413054,163.47271328172894L779.4529977645009,166.04024057021945L781.5534817759367,165.6698660518441L782.4448844973772,166.84135255489866L780.958437266529,168.55357624016438L780.6692193418417,170.73326538451477L778.0952932849048,175.3274507565568L779.6448494974966,176.98906078467462L778.2652377091888,180.67913615882503L778.885828025929,182.7605826439525L780.7499034711038,182.9788772975935L781.4189657717166,185.26098883952523L786.1800702150525,188.101241815599L785.865551901261,189.86584091194936L782.3056096499913,193.84018733595508L782.3927184716545,195.30141933746268L779.0051836000212,197.63780618908459L776.0813674367477,197.74953475879056L774.1594166568768,200.27900751323045L722.6066303114933,210.3678108515454L708.0068074675554,212.8493556171353L705.2118275682193,195.84241377032617L701.115674416374,170.91807049844567L701.115674416374,170.91807049844567L703.4790740233354,169.48319622724364L710.461212382511,163.80849760409535Z" id="Pennsylvania" class="mapPath"></path><path d="M828.1450719500249,149.3763741858245L830.0507210694537,152.38738895283473L827.5124671478075,153.49136085225018ZM822.0479785671416,144.384397707291L824.017679172141,143.86414848058996L825.8840878803776,147.95235291358426L827.619423863548,148.87672296963274L825.9288877734266,149.00661451762608L825.2480683508556,152.0653571476406L825.8069076445936,155.96907553433255L820.9566409898363,158.19759927798293L821.3265114567645,156.29064335065084L818.5231883265835,145.52009904895476Z" id="RhodeIsland" class="mapPath"></path><path d="M688.5976504536507,304.57567063801287L691.5554869512612,302.38642862071924L695.5542987837498,301.0812415217662L714.1310720015858,299.1962420617888L714.5202394825915,301.1191546644976L715.898955777065,299.7504451869712L718.7022727290258,302.5389517948761L718.8010075799923,304.71710582820094L735.689638726173,302.2037932998436L755.9348011435773,316.79194300048187L753.4491979742609,318.194378755803L750.681125415457,321.8419180386986L748.2897087583419,327.192086342984L748.3937081401671,331.148356226023L746.3356855110552,334.6510195101904L742.8938163773632,335.2557485981912L742.5261127118237,337.61815346801427L739.3261717978892,340.67690053014417L737.7514858269319,343.65928867144055L734.7289751337099,345.31718957719534L731.7315566646535,348.7357330282972L731.6102799276839,350.11070595277397L728.6343226826141,352.1614523894202L725.7859858986405,356.682825704935L721.9503854066797,355.62793759738076L721.3683526518986,352.4933086160719L718.1268523752676,347.90116912890016L715.8048794511074,346.9086417146559L715.0227729928599,342.96916376841966L713.540380657015,340.07371430215653L708.9813926689327,337.8528192542824L705.7732410530939,334.7941165406552L705.6220358174244,332.6301217855248L701.0521033411719,330.07753189450466L698.5416816198656,326.90327198330283L694.7006035031993,325.0606911831196L691.7367116565014,321.5248470987576L690.9367961776401,319.45131030477853L688.0444455621639,315.69103408685476L686.5125598690792,316.214915386278L680.9222478971075,312.91554817294855L680.9096886985141,310.9401651618575L683.5852647255116,306.51867033142537Z" id="SouthCarolina" class="mapPath"></path><path d="M384.14897664882676,109.52299545522192L481.3706824871805,114.13303283154062L481.07263714811177,116.27692164701068L477.4694140189821,120.23640250225935L479.7341794923738,123.83461836192771L482.73887156174135,126.00132023636911L482.5792398274297,159.6405303416932L480.8044247335514,160.0419364469335L481.53454981593404,161.58779725736588L481.071410650761,164.87467713468084L482.76833375960064,166.73438138105143L481.7215839194361,168.06607157325527L481.2544061057259,171.76654527992105L480.0432330557633,174.53715882188033L482.56388962967424,178.6683752226753L480.09420203395257,178.1397514019875L479.214737230148,175.45759049198352L472.0830593831379,171.8873025690168L465.6718654006104,171.78926228422768L463.74163628523013,171.34192532600343L462.06418632104965,173.16083771057538L455.1379793586266,169.60394273755685L454.7157984675425,168.66688164477307L412.27893875972,166.85162362218273L389.279279401805,165.17905735580428L379.4183703053286,164.37958890380935L382.50846759652615,127.14330010231527L382.7243905932953,127.16163282928801Z" id="SouthDakota" class="mapPath"></path><path d="M606.6766843601283,286.645470538057L606.1492524495843,283.2701517490199L609.4584708949742,283.8186559170962L628.0368455206715,281.6831700403485L644.4442834032902,280.68414507845637L647.3302756192996,280.152736717426L658.3872671909056,279.48125860827815L671.0041652145868,278.103672500167L671.2061023891675,277.7649503748801L700.5523777232653,273.8324977508347L700.5733540608838,278.3199591075713L697.9669261279956,279.65151150023496L696.6231251339184,283.40008567908785L693.846059392758,283.0779305122337L688.5225902345138,287.4945353250482L687.856139381391,285.71224185755386L685.9999891978578,287.22455095588145L683.3288746562353,291.8682666692057L679.637322483721,293.4131834198648L676.3457681660607,296.7685011089143L672.2708477516823,297.40573553621743L668.9402444730058,300.64126629967154L668.1793205516119,303.85751354412525L665.2720189039958,304.63644593180675L665.4048252319898,309.0899507325836L646.0228861840691,311.4546901823777L619.5394298853671,313.80444441962175L606.8025548680392,315.0121749862352L602.7449359147271,315.3400390570382L574.8984533346297,317.2794429192594L576.3597565713209,316.6743974160345L577.6475058939513,313.28766114440964L577.1192107150868,308.7716033601538L579.7248595918711,305.5058728662433L580.0333552585737,302.59036561448545L582.1818227124799,301.4165187284766L582.4425701964611,297.8821101004751L585.0647534963482,292.94659960291494L584.6676265102861,288.3166577854802L585.4802266506815,288.26109830332973L586.4552895195195,288.19380985033604L588.2282454083145,287.8626955254326Z" id="Tennessee" class="mapPath"></path><path d="M402.2749496219448,288.8353295620468L429.1962221992817,290.2263434056613L427.6592055307538,326.72498027889435L428.8363701509594,326.5676617574044L432.1181959061072,330.31100123627687L433.98250517943876,329.7633505497066L438.8273691839701,330.1440733866507L439.7940430543678,333.78711995759613L442.9042293664281,333.6819401927381L446.2113308967687,335.43206175469504L449.2401252561766,335.31091653421186L450.4591968310773,336.88993484149364L452.43614398021055,335.1876589553128L455.3560447592738,336.0821208647767L456.57096061868975,338.1711255884426L458.7521483013877,338.526652090428L459.8796416978007,341.1259848710388L462.6214968436176,338.7038403338786L466.2185048984929,340.20641876595494L467.5442312082222,341.77193090360595L469.32493051512415,341.0752034972047L470.5601801437338,343.4609435496495L474.4854020353682,339.2793941254814L475.5605982816944,341.45346240623996L478.93354670228064,341.47977034657265L482.1319087319933,342.83698339216744L483.30752567368404,344.4901492620993L486.3540028871761,341.61331906943644L489.64233546193043,340.6874337477997L491.1611116759782,341.7160381392126L494.7798580677321,339.8505969227964L495.62707801303,340.87726008813115L499.5894238877871,340.95606650577463L500.5874879445952,339.29947212523496L504.5649361924287,341.1165257290804L506.1081544387754,343.26278888657L512.0507371055172,345.24062095280385L513.6868364166401,346.96499601428707L516.7161197419576,345.9830388849681L518.9322411998942,346.7632269213494L519.1380736476037,356.74889194761295L519.5344510153614,375.97856959301816L523.0810401168004,380.01253180060905L523.2619645926341,384.11815782697613L527.7972699646052,391.6066162704042L528.1630457704014,395.60000733187087L526.6217681799997,400.46108841998296L525.0892712958672,402.44702142217784L525.6784090571157,404.99604917933766L524.5803216731765,406.9698181437452L525.9008096332133,410.52478937050455L522.2488600416464,417.26578259014445L523.7097967358162,419.075717961632L521.0480253050381,419.2363097708202L512.6508498041032,421.947896463854L509.60667266941647,420.55985787658676L509.03275332604056,417.4974438177712L506.92927784148435,419.6729829381338L505.4135938642322,419.17856512735784L504.64192165840024,421.84697728811136L506.3449483355127,422.95366147482184L506.6524097783372,426.42718857460034L503.6544658435135,430.13904904094926L498.7654054725364,434.77605094500666L488.89896579385163,439.70973285755935L487.9095146423126,438.8929585232861L484.9386532073316,440.11359075092065L484.85138415778005,438.9905727210516L480.79984339357515,439.79203851246154L478.92472381307664,437.4334867889197L477.75306293011874,437.9362301151482L482.0471886235596,442.75725955173004L478.8820323366814,444.27099001782284L475.91135699540246,443.33147010595417L475.43199888211757,446.6935487184257L471.68874748941374,450.12405947924975L467.79939617658334,456.4963896352027L465.24448376561315,463.1792900243832L463.4258516140429,462.6425965205659L462.9297341403467,465.07642459588703L464.8592913036627,464.4961743877821L463.8691360151864,469.36236926039976L462.5821057843895,469.5451146445945L462.44528538278166,472.287041600398L463.98339085385635,473.8356119807614L464.3583941591002,479.42636886816075L466.17684783269635,481.3811501943471L466.5900258109484,484.93732097163786L468.03122586506845,488.09941963211105L462.8051485490693,489.94960212317517L460.7111769246175,487.4821355972464L456.74163601390273,486.4958032880936L451.45432695655654,486.5849797339449L446.9917986967923,483.43265603463385L443.57777371397765,483.03601109870243L441.06063195736095,480.52756503862537L437.5778356953847,479.60814633724743L435.25642087142177,477.1967040974683L433.8818937280316,471.56125693775186L430.9735247865892,468.10273591524594L431.4425821704214,465.270967304956L430.1833152566553,462.1714679205401L430.7365639118994,459.54427932313416L428.75264338360194,456.5160125758912L427.0364849705794,456.14423127949294L424.32575618610946,453.385865244623L423.55718782023405,449.9891083908258L421.24297673422274,446.8307481244388L417.8329174498506,444.1285758612476L416.3781058264566,438.44462980318906L414.83217159886226,436.8393923541357L412.89535419131073,432.24811004415875L412.359723931025,428.5394558318592L410.4390794671002,425.78298368096785L407.08514201892007,423.25506941458184L406.3709436941908,421.5786748706596L403.24848338251354,419.97490009152716L400.99383167495733,415.7491296533142L393.9631184135086,414.4093002128428L389.7010383773096,414.34576444014124L386.1673730490137,412.6778810418674L385.24092739025707,414.5648117792906L381.30290043930216,414.91019070407185L378.10243842352344,418.58109756940814L375.8734886918989,424.67333465712386L374.8857159141797,424.70346660328175L372.38263581063256,428.206353655596L369.6953372550674,428.1048844216947L365.9028720095705,424.93911925457473L356.2272266203011,419.52364892085757L354.48648300905694,416.90932479279877L350.79571837606807,414.2207087329788L348.53715775416526,408.67221233433474L348.8001251829901,403.86318411772106L346.4371825077592,399.7345939162984L346.13956563894055,396.3096476556635L344.5936835764531,394.00106113745267L338.7067257884345,390.23538377301634L335.83060384981263,385.61661243843514L333.2959502218418,383.81003535433274L330.81931426150265,379.83687516267673L327.0483509463554,377.47364617219614L324.8212513789637,372.27258824902776L322.6103482186883,370.9948145380671L321.0450827845674,368.6486014414984L321.6807175770955,366.85857009105825L377.3740271007042,372.05459154454115L378.7723010093344,353.28440612828456L380.5234362661584,334.3078663259595L384.0735485137171,287.6027650853166L384.64210032332505,287.64483899869947Z" id="Texas" class="mapPath"></path><path d="M266.97354741014306,169.053496240169L282.1799350125684,171.46858137784818L279.2060856612808,190.0954620978813L306.8446238635662,194.21046993247467L301.93620555639984,229.16498675211517L299.66578842239494,245.01127162721832L299.6195066119641,247.09022537619057L296.61007318217173,268.88279274345723L275.33170215576996,265.6736305679822L223.6615221381652,256.84367072628766L241.5033802898587,164.41986129692418Z" id="Utah" class="mapPath"></path><path d="M808.0878053473893,89.94503562417799L808.6976136495032,91.69093842042992L807.7285846726106,95.12405869154384L809.7033859481621,97.78462759210754L808.3983502475169,101.41326710123053L804.5315157066751,104.21822740309767L805.7544271252391,108.67144336137153L805.0026047339218,110.45464336461407L804.9093232825614,114.82446208605302L803.5379849860215,118.99001502379724L804.4773617569012,126.91657829780127L805.2771653468587,129.47230109842894L804.3747000399563,130.76105791283658L804.9088802960246,133.4908770701809L806.4193633383201,134.59531310922443L795.619243356459,136.95970963921138L795.0843376850465,135.3956643504913L792.4468684174865,122.70382096071171L789.6407747445776,120.21430133724823L789.9927450615431,118.54350487908209L787.6416479385122,113.83101224807592L788.2393176496372,109.778800717855L787.7445969405037,106.20414276021415L785.7439742539027,103.20821208576353L785.6266605882113,99.65077810575053L784.5667021336577,95.90232792114898L797.8620727415225,92.80588483358315Z" id="Vermont" class="mapPath"></path><path d="M229.85199324167547,28.490963827517362L224.69273624467968,50.79118222389559L219.30814344953285,75.03310160530248L218.76500390945984,76.47935586999643L219.70937699588058,80.03846732717477L219.06525348440363,83.24269162905694L192.9062170795401,76.98566723040403L190.88414275622978,77.74799014745315L185.7404415546149,76.88092398471349L179.80971863982313,77.0548387831775L176.23829690130538,78.03020762744666L172.37578289828457,77.54643144311183L170.95313534081936,76.21861784361352L163.35848350728804,76.93319522440186L163.26574833409933,75.63667217876605L159.53665517916937,73.55683429023588L156.0115175902897,72.8990024546647L149.6988085708034,74.20553951904844L143.7933655995643,70.38742067727264L144.73970467462414,64.80996926389741L144.20496457485297,62.315051578332486L142.0905751068957,59.67654920007055L140.87563533233254,59.53232332006769L138.75692487352399,59.4388966153175L137.19181102494866,56.73751928236118L135.15667280792178,55.38285201817905L133.00094433172836,55.90606706449489L131.101459459455,53.62424879599348L132.3168584097295,51.32815996927252L134.32323529109908,50.550841478918755L132.95288866122996,46.08728885254391L134.22099689742873,35.93653130346797L133.60846241500474,34.365943964618396L134.37198318833572,27.15901813654864L132.8021480924428,23.804184179809226L133.4411598593373,18.267293190283226L135.8363928445312,15.1922030979689L137.75463775070716,17.58772050644052L142.00595079253475,21.32430921557716L145.39620772298144,22.241060097685477L148.50037527602478,24.11962038608442L151.92862596988044,24.180730163601538L152.99259033877996,26.18302310188494L155.8664998833092,26.91384781454792L156.7305275996497,31.386984437046067L158.2766383810595,31.51417435046767L157.03376468848836,36.861782245362406L156.53497684584153,41.8993459016408L157.88128426085677,41.75413843839385L157.84610567527932,37.30528578762437L159.32167357826063,33.39623947622715L162.4806028480341,29.86340721976387L161.36016155777224,27.753192042917362L162.06061257863593,24.791175050638117L161.79036675197585,21.238277393414933L163.04990100143033,19.0717239799518L163.0402350016094,16.123202326352157L161.2509290056861,15.188774505403217L160.0728178502082,12.638956362188878L161.09187610883004,10.83019194524195ZM158.01248967445576,23.208573468785175L159.82016098651326,22.885863924493606L158.5202706440371,26.41342896688718L156.9962478532887,24.49696588242523ZM155.7393518679006,17.27620695084147L157.7308528656111,15.3278445837949L158.68509911197856,18.659789189025787L157.45483358098937,20.93843299788739L154.88893692132717,19.45316440613942Z" id="Washington" class="mapPath"></path><path d="M705.2118275682193,195.84241377032617L708.0068074675554,212.8493556171353L722.6066303114933,210.3678108515454L724.1306553769225,219.95409220370095L726.6067096704143,217.73436477762266L728.8188215574652,214.08750905171917L730.776635607975,214.36367111636412L733.0453654309247,211.11654105474054L737.4381816871266,211.6690519992352L737.5965508659625,209.53888248331248L739.9169727182452,209.20798912642795L740.9512967156436,207.54120926014048L743.6559966988866,208.81210976226419L746.0326426510788,208.35446484267106L748.6487133878372,213.21066422239812L747.7966312508938,217.05766472995947L739.3001243849769,212.26583668548642L739.5576670405424,217.8906173085203L734.3623666667264,226.62165798156104L732.2808816199035,225.3200978761305L730.4324520998289,232.47283231800566L729.2200918160837,234.26215970229146L726.7324481905104,233.86218311624475L723.8682167216925,231.74140106488835L723.5153227287211,236.2051223205326L721.2887920696083,240.15098141127385L720.7610601792245,243.6984836766767L718.547086101072,246.90083487243567L717.4621916386875,250.11939491375983L717.9436183214061,253.49459511811676L715.6758413064363,255.545599799971L714.9359020111779,254.51598005306164L708.9197228724005,259.15225937323123L705.3385659120682,260.7641026596682L703.0454778203707,259.1357164091993L700.6350785322551,262.015440425119L698.8162670988921,262.39728223667623L696.1133552017391,261.238438163076L693.6502565197044,258.36886357630294L693.6609939772844,256.80099310462276L691.7089710925363,256.77664350664725L688.6163258371168,255.0369019224098L687.5916063945003,252.99375386095357L684.8990529191336,250.56359353413598L682.6518447417179,247.231982892274L682.2477171752763,241.55177062847713L685.9589217403302,240.60221576683455L686.15223285207,238.06948042905378L687.7263868546731,236.79613239279706L686.603999668607,234.03775679371358L688.5949106983505,229.1523070786094L691.1244192216666,231.69937091351665L692.3446437191681,229.74086881840378L691.6326550523587,227.65498559814773L692.878789923962,223.81151367307712L694.5226758468642,223.66546742664082L695.7415127451995,220.762085031948L697.4790240094156,221.74688844494426L699.1316693938319,220.65286733037522L703.6544774097572,213.7664809124741L703.8569439238516,206.72814334824898L705.0381632087795,201.93524094904342L704.6481995947611,199.07136815181366L703.3271356207191,197.19604551208715Z" id="WestVirginia" class="mapPath"></path><path d="M560.5475680906151,100.20326853600352L563.009789802566,101.17964764470298L564.6147932905567,104.2491968069537L578.1672775321603,107.1207460551816L583.9028972122518,109.45495630080791L585.5575813668067,108.71113480976283L591.2402071960104,110.09543282864774L592.9287718658505,112.31215635507658L595.8252391296415,114.32119249478637L595.9650086773729,117.59356228117736L594.9688691295368,120.24628531117037L598.0822108321152,120.38676752100048L597.0961284786864,123.1442995259905L599.276685280689,124.90529840976376L598.9719829554444,127.19406366898318L596.4878223658988,127.82220406911983L594.6898099839764,132.29470119911707L594.1433798737426,135.32396571404604L595.7081194148021,135.7061835840916L597.5686883163228,133.5912234278578L599.4136483602504,129.7260476759352L602.0244558349243,128.052084535198L603.7514231323128,123.16354178018435L606.3809490664029,121.88943537577131L606.3970377557747,124.35589517447784L604.7383441892009,126.77423736207697L601.7664514627905,134.86692530931919L601.1352156194556,139.24810677604978L601.481507282828,142.30749279249596L600.1874583768756,143.45257604175697L599.3133381084721,147.75427123592965L600.0656321950231,151.2968171968405L599.0955555445541,153.7530863793403L597.9762351487261,159.72918876703056L598.7400856411267,164.30816202583446L600.7266254558342,168.26699769887603L600.6760523037519,173.74630886454224L587.2317328460733,174.8384864932499L561.9413629642941,176.20400854107584L560.8372813701617,173.8949303652007L555.8713177678015,171.9980734254683L554.6751121470313,169.07217465852818L554.0148643857663,164.8835268889094L555.528461107374,162.54069982349188L553.4366976657107,160.7951874467674L553.1492432263587,158.0312797942796L552.3043536488835,155.9131951831498L552.5234596858851,152.91966267719692L549.7550528087478,148.94339164667178L547.5980169527504,148.3259292791647L543.6537397667511,145.3183088527718L542.8910561957204,142.88661458248316L538.7282297468585,141.00528187222164L537.2665311509214,139.0100215217799L534.494278129575,138.80607263036177L530.893593056439,135.5473376058585L531.5999957412209,128.65630748192768L531.203580489924,125.49472239424972L532.6118663286885,122.57915981583312L530.882586951505,120.28520605938093L529.3727186496271,120.1309941411863L529.4998757944844,117.46713573489012L532.358294716608,113.38182540641355L536.0006979252136,111.71431201494636L536.7388164715592,110.56157421579371L536.3093025139531,99.55184191622152L538.8505205385316,97.92012100232012L539.8687220837581,98.69375074374716L542.7612850896289,98.77298378354612L551.529755007342,95.19012110853203L554.7317088096495,93.28664448338623L555.9251423925555,94.54706456612928L554.3041788657806,97.08407776812976L558.6990427641182,100.00425979167483Z" id="Wisconsin" class="mapPath"></path><path d="M316.7021466791289,119.69173111652776L358.1420951571532,124.72957772776522L382.50846759652615,127.14330010231527L379.4183703053286,164.37958890380935L376.23661495224616,201.84152269558513L352.9038444683383,199.75601968101762L322.4925455903443,196.17367918503373L306.8446238635662,194.21046993247467L279.2060856612808,190.0954620978813L282.1799350125684,171.46858137784818L289.50553423066026,125.58425883168934L290.9852989773508,115.85753522360108Z" id="Wyoming" class="mapPath"></path><path id="PuertoRico" class="mapPath"></path></g>';
    var D3URL = 'http://d3js.org/d3.v3.min.js';
    var USMAPTopoJSON = 'http://bl.ocks.org/mbostock/raw/4090846/us.json';


    /**
     * US map layout class, this require d3.js
     *
     files:
     http://d3js.org/d3.v3.min.js

     * example

     var topo = new nx.graphic.Topology({
        adaptive: true,
        nodeConfig: {
                        label: 'model.name'
                    },
        showIcon: false,
        layoutType: 'USMap',
        layoutConfig: {
            longitude: 'model.longitude',
            latitude: 'model.latitude'
        },
        data: topologyData
     })

     * @class nx.graphic.Topology.USMapLayout
     * @module nx.graphic.Topology
     */

    /**
     * Map's longitude attribute
     * @property longitude
     */
    /**
     * Map's latitude attribute
     * @property latitude
     */

    nx.define("nx.graphic.Topology.USMapLayout", {
        properties: {
            topology: {}
        },
        methods: {
            process: function (graph, config, callback) {
                // load d3

                if (typeof(d3) === "undefined") {
                    util.loadScript(D3URL, function () {
                        this._process(graph, config, callback);
                    }.bind(this));
                } else {
                    this._process(graph, config, callback);
                }

            },
            _process: function (graph, config, callback) {
                var topo = this.topology();
                var projection = d3.geo.albersUsa();
                topo.prependLayer('usmap', 'nx.graphic.Topology.USMapLayer');

                var longitude = config.longitude || 'model.longitude',
                    latitude = config.latitude || 'model.latitude';


                topo.projectionXRange([0, 960]);
                topo.projectionYRange([0, 500]);

                topo._setProjection(false, false);

                topo.eachNode(function (n) {

                    var model = n.model();
                    var p = projection([nx.path(n, longitude), nx.path(n, latitude)]);
                    model.autoSave(false);
                    model.position({
                        x: p[0],
                        y: p[1]
                    });
                });

                topo.adjustLayout();

                topo.getLayer("usmap").updateMap();

                if (callback) {
                    callback.call(topo);
                }

            }
        }
    });


    //

    nx.define("nx.graphic.Topology.USMapLayer", nx.graphic.Topology.Layer, {
        view: {
            type: 'nx.graphic.Group',
            content: {
                name: 'map',
                type: 'nx.graphic.Group'
            }
        },
        methods: {
            draw: function () {

                var map = this.view('map');
                var ns = "http://www.w3.org/2000/svg";
                var el = new DOMParser().parseFromString('<svg  xmlns="' + ns + '">' + USMAP + '</svg>', 'text/xml');
                map.view().dom().$dom.appendChild(document.importNode(el.documentElement.firstChild, true));

                this.topology().on("resetzooming", this.update, this);
                this.topology().on("zoomend", this.update, this);
                this.topology().on("fitStage", this.updateMap, this);
            },
            updateMap: function () {
                var g = this.view('map');
                var width = 960, height = 500;
                var scale = Math.min(this.topology().containerWidth() / width, this.topology().containerHeight() / height);
                var translateX = (this.topology().containerWidth() - width * scale) / 2;
                var translateY = (this.topology().containerHeight() - height * scale) / 2;
                g.setTransform(translateX, translateY, scale);
            },
            update: function () {
                var topo = this.topology();
                this.set("scale", topo.scale());
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    var D3URL = 'http://d3js.org/d3.v3.min.js';
    var D3TOPOJSON = 'http://d3js.org/topojson.v1.min.js';
    var WORLDMAPTopoJSON = 'http://bl.ocks.org/mbostock/raw/4090846/world-50m.json';
    var width = 960, height = 480;
    var projection;


    /**
     * World map layout, this require d3.js and d3 topojsonv1.js

     files:
     http://d3js.org/d3.v3.min.js
     http://d3js.org/topojson.v1.min.js

     * example

     var topo = new nx.graphic.Topology({
        adaptive: true,
        nodeConfig: {
                        label: 'model.name'
                    },
        showIcon: false,
        identityKey: 'name',
        layoutType: 'WorldMap',
        layoutConfig: {
            longitude: 'model.longitude',
            latitude: 'model.latitude',
            worldTopoJson: 'lib/world-50m.json'
        },
        data: topologyData
     })

     * @class nx.graphic.Topology.WorldMapLayout
     * @module nx.graphic.Topology
     */
    /**
     * Map's longitude attribute
     * @property longitude
     */
    /**
     * Map's latitude attribute
     * @property latitude
     */
    /**
     * world topo json file url, this should be under the same domain.
     * Could download from here : http://bl.ocks.org/mbostock/raw/4090846/world-50m.json
     * @property worldTopoJson
     */
    nx.define("nx.graphic.Topology.WorldMapLayout", {
        properties: {
            topology: {}
        },
        methods: {
            process: function (graph, config, callback) {
                // load d3

                if (!config.worldTopoJson) {
                    console.log('Please idenity world topo json url, download from:http://bl.ocks.org/mbostock/raw/4090846/world-50m.json');
                    return;
                }

                WORLDMAPTopoJSON = config.worldTopoJson;


                this._loadD3(function () {
                    this._loadTopoJSON(function () {
                        this._process(graph, config, callback);
                    }.bind(this));
                }.bind(this));
            },
            _loadD3: function (fn) {
                if (typeof(d3) === "undefined") {
                    util.loadScript(D3TOPOJSON, function () {
                        fn.call(this);
                    }.bind(this));
                } else {
                    fn.call(this);
                }
            },
            _loadTopoJSON: function (fn) {
                if (typeof(topojson) === "undefined") {
                    util.loadScript(D3TOPOJSON, function () {
                        fn.call(this);
                    }.bind(this));
                } else {
                    fn.call(this);
                }
            },
            _process: function (graph, config, callback) {
                var topo = this.topology();

                projection = d3.geo.equirectangular().translate([width / 2, height / 2]).precision(0.1);
                topo.prependLayer('worldMap', 'nx.graphic.Topology.WorldMapLayer');

                var longitude = config.longitude || 'model.longitude',
                    latitude = config.latitude || 'model.latitude';


                topo.projectionXRange([0, 960]);
                topo.projectionYRange([0, 500]);

                topo._setProjection(false, false);

                topo.eachNode(function (n) {

                    var model = n.model();
                    var p = projection([nx.path(n, longitude), nx.path(n, latitude)]);
                    model.autoSave(false);
                    model.position({
                        x: p[0],
                        y: p[1]
                    });
                });

                topo.adjustLayout();

                topo.getLayer("worldMap").updateMap();

                if (callback) {
                    callback.call(topo);
                }
            }

        }
    });


    //

    nx.define("nx.graphic.Topology.WorldMapLayer", nx.graphic.Topology.Layer, {
        view: {
            type: 'nx.graphic.Group',
            content: {
                name: 'map',
                type: 'nx.graphic.Group'
            }
        },
        methods: {
            draw: function () {

                var map = this.view('map');

                var group = d3.select(map.view().dom().$dom);

                var path = d3.geo.path().projection(projection);

                d3.json(WORLDMAPTopoJSON, function (error, world) {
                    group.insert("path", ".graticule")
                        .datum(topojson.feature(world, world.objects.land))
                        .attr("class", "land mapPath")
                        .attr("d", path);

                    group.insert("path", ".graticule")
                        .datum(topojson.mesh(world, world.objects.countries, function (a, b) {
                            return a !== b;
                        }))
                        .attr("class", "boundary mapBoundary")
                        .attr("d", path);
                });

                this.topology().on("resetzooming", this.update, this);
                this.topology().on("zoomend", this.update, this);
                this.topology().on("fitStage", this.updateMap, this);
            },
            updateMap: function () {
                var g = this.view('map');
                var scale = Math.min(this.topology().containerWidth() / width, this.topology().containerHeight() / height);
                var translateX = (this.topology().containerWidth() - width * scale) / 2;
                var translateY = (this.topology().containerHeight() - height * scale) / 2;
                g.setTransform(translateX, translateY, scale);
            },
            update: function () {
                var topo = this.topology();
                this.set("scale", topo.scale());
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, global) {
    /**
     * Topology tooltip policy
     * @class nx.graphic.Topology.TooltipPolicy
     */

    nx.define("nx.graphic.Topology.TooltipPolicy", {
        events: [],
        properties: {
            topology: {},
            tooltipManager: {}
        },
        methods: {
            init: function (args) {
                this.inherited(args);
                this.sets(args);
                this._tm = this.tooltipManager();
            },
            pressStage: function () {
                this._tm.closeAll();
            },
            zooming: function () {
                this._tm.closeAll();
            },
            clickNode: function (node) {
                this._tm.openNodeTooltip(node);
            },
            clickLinkSetNumber: function (linkSet) {
                this._tm.openLinkSetTooltip(linkSet);
            },
            dragStageStart: function () {
               this._tm.closeAll();
            }
        }
    });

})(nx, nx.global);
(function (nx, global) {
    /**
     * Basic tooltip class for topology
     * @class nx.graphic.Topology.Tooltip
     * @extend nx.ui.Popover
     */
    nx.define("nx.graphic.Topology.Tooltip", nx.ui.Popover, {
        properties: {
            /**
             * Lazy closing a tooltip
             * @type Boolean
             * @property lazyClose
             */
            lazyClose: {
                value: false
            },
            /**
             * Pin a tooltip
             * @type Boolean
             * @property pin
             */
            pin: {
                value: false
            },
            /**
             * Is tooltip response to resize event
             * @type Boolean
             * @property listenWindow
             */
            listenWindow: {
                value: true
            }
        }
    });
})(nx, nx.global);
(function (nx, util, global) {
    /**
     * Node tooltip content class
     * @class nx.graphic.NodeTooltipContent
     * @extend nx.ui.Component
     * @module nx.graphic.Topology
     */

    nx.define('nx.graphic.Topology.NodeTooltipContent', nx.ui.Component, {
        properties: {
            node: {
                set: function (value) {
                    var model = value.model();
                    this.resolve('list').set('items', new nx.data.Dictionary(model.getData()));
                    this.title(value.label());
                }
            },
            topology: {},
            title: {}
        },
        view: {
            content: [
                {
                    name: 'header',
                    props: {
                        'class': 'n-topology-node-tootltip-header'
                    },
                    content: [
                        {
                            tag: 'span',
                            props: {
                                'class': 'n-topology-node-tootltip-header-text'
                            },
                            name: 'title',
                            content: '{#title}'
                        }
                    ]
                },
                {
                    name: 'content',
                    props: {
                        'class': 'n-topology-node-tootltip-content n-list'
                    },
                    content: [
                        {
                            name: 'list',
                            tag: 'ul',
                            props: {
                                'class': 'n-list-wrap',
                                template: {
                                    tag: 'li',
                                    props: {
                                        'class': 'n-list-item-i',
                                        role: 'listitem'
                                    },
                                    content: [
                                        {
                                            tag: 'label',
                                            content: '{key}: '
                                        },
                                        {
                                            tag: 'span',
                                            content: '{value}'
                                        }
                                    ]

                                }
                            }
                        }
                    ]
                }
            ]
        },
        methods: {
            init: function (args) {
                this.inherited(args);
                this.sets(args);
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * @class nx.graphic.LinkTooltipContent
     * @extend nx.ui.Component
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.LinkTooltipContent", nx.ui.Component, {
        view: {},
        methods: {
            onInit: function () {
                this.watch("model", function (prop, value) {
                    if (value) {
                        this.resolve().setContent(value.get("id"));
                    }
                }, this);
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * @class nx.graphic.LinkSetTooltipContent
     * @extend nx.ui.Component
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.linkSetTooltipContent", nx.ui.Component, {
        properties: {
            linkSet: {
                set: function (value) {
                    var items = [];
                    var edges = value.model().getEdges(false, true);
                    nx.each(edges, function (edge) {
                        items.push({
                            item: "Source:" + edge.sourceID() + " Target :" + edge.targetID(),
                            edge: edge});
                    });
                    this.resolve("list").items(items);
                }
            },
            topology: {}
        },
        view: [
            {
                props: {
                    style: {
                        'maxHeight': '247px',
                        'overflow': 'auto',
                        'overflow-x': 'hidden'
                    }
                },
                content: {
                    name: 'list',
                    props: {
                        'class': 'list-group',
                        style: 'width:200px',
                        template: {
                            tag: 'a',
                            props: {
                                'class': 'list-group-item'
                            },
                            content: '{item}',
                            events: {
                                'click': '{#_click}'
                            }
                        }
                    }
                }
            }
        ],
        methods: {
            _click: function (sender, events) {
                var link = sender.model().edge;
                this.topology().fire('clickLink', link);
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {


    /**
     * Tooltip manager for topology
     * @class nx.graphic.Topology.TooltipManager
     * @extend nx.data.ObservableObject
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.TooltipManager", {
        events: ['openNodeToolTip', 'closeNodeToolTip', 'openLinkToolTip', 'closeLinkToolTip', 'openLinkSetTooltip', 'closeLinkSetToolTip'],
        properties: {
            /**
             * Get topology
             * @property  topology
             */
            topology: {
                value: null
            },
            /**
             * All tooltip's instance array
             */
            tooltips: {
                value: function () {
                    return new nx.data.ObservableDictionary();
                }
            },
            /**
             * Get node's tooltip
             * @property nodeTooltip
             */
            nodeTooltip: {},
            /**
             * Get link's tooltip
             * @property linkTooltip
             */
            linkTooltip: {},
            /**
             * Get linkSet tooltip
             * @method linkSetTooltip
             */
            linkSetTooltip: {},
            nodeSetTooltip: {},

            /**
             * node tooltip class
             * @property nodeTooltipClass
             */
            nodeTooltipClass: {
                value: 'nx.graphic.Topology.Tooltip'
            },

            /**
             * link tooltip class
             * @property linkTooltipClass
             */
            linkTooltipClass: {
                value: 'nx.graphic.Topology.Tooltip'
            },
            /**
             * linkSet tooltip class
             * @property linkSetTooltipClass
             */
            linkSetTooltipClass: {
                value: 'nx.graphic.Topology.Tooltip'
            },
            nodeSetTooltipClass: {
                value: 'nx.graphic.Topology.Tooltip'
            },
            /**
             * @property nodeTooltipContentClass
             */
            nodeTooltipContentClass: {
                value: 'nx.graphic.Topology.NodeTooltipContent'
            },
            /**
             * @property linkTooltipContentClass
             */
            linkTooltipContentClass: {
                value: 'nx.graphic.Topology.linkTooltipContent'
            },
            /**
             * @property linkSetTooltipContentClass
             */
            linkSetTooltipContentClass: {
                value: 'nx.graphic.Topology.linkSetTooltipContent'
            },

            nodeSetTooltipContentClass: {
                value: 'nx.graphic.Topology.nodeSetTooltipContent'
            },
            /**
             * Show/hide node's tooltip
             * @type Boolean
             * @property showNodeTooltip
             */
            showNodeTooltip: {
                value: true
            },
            /**
             * Show/hide link's tooltip
             * @type Boolean
             * @property showLinkTooltip
             */
            showLinkTooltip: {
                value: true
            },
            /**
             * Show/hide linkSet's tooltip
             * @type Boolean
             * @property showLinkSetTooltip
             */
            showLinkSetTooltip: {
                value: true
            },
            showNodeSetTooltip: {
                value: true
            },
            /**
             * Tooltip policy class
             * @property tooltipPolicyClass
             */
            tooltipPolicyClass: {
                value: 'nx.graphic.Topology.TooltipPolicy'
            },
            tooltipPolicy: {},
            /**
             * Set/get tooltip's activate statues
             * @property activated
             */
            activated: {
                value: true
            }
        },
        methods: {

            init: function (args) {

                this.inherited(args);

                this.sets(args);

                this.registerTooltip('nodeTooltip', this.nodeTooltipClass());
                this.registerTooltip('linkTooltip', this.linkTooltipClass());
                this.registerTooltip('linkSetTooltip', this.linkSetTooltipClass());
                this.registerTooltip('nodeSetTooltip', this.nodeSetTooltipClass());


                //build in tooltips


                var nodeTooltip = this.getTooltip('nodeTooltip');
                nodeTooltip.on("close", function () {
                    this.fire("closeNodeToolTip");
                }, this);
                nodeTooltip.resolve('@root').addClass('n-topology-node-tootltip');
                this.nodeTooltip(nodeTooltip);


                var linkTooltip = this.getTooltip('linkTooltip');
                linkTooltip.on("close", function () {
                    this.fire("closeLinkToolTip", linkTooltip);
                }, this);
                this.linkTooltip(linkTooltip);


                var linkSetTooltip = this.getTooltip('linkSetTooltip');
                linkSetTooltip.on("close", function () {
                    this.fire("closeLinkSetToolTip", linkSetTooltip);
                }, this);
                this.linkSetTooltip(linkSetTooltip);


                var nodeSetTooltip = this.getTooltip('nodeSetTooltip');
                nodeSetTooltip.on("close", function () {
                    this.fire("closeNodeSetToolTip");
                }, this);
                this.nodeSetTooltip(nodeSetTooltip);


                var topology = this.topology();
                var tooltipPolicyClass = nx.path(global, this.tooltipPolicyClass());
                if (tooltipPolicyClass) {
                    var tooltipPolicy = new tooltipPolicyClass({
                        topology: topology,
                        tooltipManager: this
                    });
                    this.tooltipPolicy(tooltipPolicy);
                }
            },
            /**
             * Register tooltip class
             * @param name {String}
             * @param tooltipClass {nx.ui.Component}
             */
            registerTooltip: function (name, tooltipClass) {
                var tooltips = this.tooltips();
                var topology = this.topology();
                var clz = tooltipClass;
                if (nx.is(clz, 'String')) {
                    clz = nx.path(global, tooltipClass);
                }
                var instance = new clz();
                instance.sets({
                    topology: topology,
                    tooltipManager: this,
                    model: topology.graph(),
                    'data-tooltip-type': name
                });
                tooltips.setItem(name, instance);
            },
            /**
             * Get tooltip instance by name
             * @param name {String}
             * @returns {nx.ui.Component}
             */
            getTooltip: function (name) {
                var tooltips = this.tooltips();
                return tooltips.getItem(name);
            },

            executeAction: function (action, data) {
                if (this.activated()) {
                    var tooltipPolicy = this.tooltipPolicy();
                    if (tooltipPolicy && tooltipPolicy[action]) {
                        tooltipPolicy[action].call(tooltipPolicy, data);
                    }
                }
            },
            _getNodeAbsolutePosition: function (node) {
                var topo = this.topology();
                var position = node.position();
                var topologyOffset = topo.resolve('@root').getOffset();
                var stageTranslate = topo.stage().translate();
                return {
                    x: position.x + topologyOffset.left + stageTranslate.x,
                    y: position.y + topologyOffset.top + stageTranslate.y
                };
            },
            /**
             * Open a node's tooltip
             * @param node {nx.graphic.Topology.Node}
             * @param position {Object}
             * @method openNodeTooltip
             */
            openNodeTooltip: function (node, position) {
                var topo = this.topology();
                var nodeTooltip = this.nodeTooltip();
                var content;

                nodeTooltip.close(true);

                if (this.showNodeTooltip() === false) {
                    return;
                }


                var pos = position || this._getNodeAbsolutePosition(node);

                var contentClass = nx.path(global, this.nodeTooltipContentClass());
                if (contentClass) {
                    content = new contentClass();
                    content.sets({
                        topology: topo,
                        node: node,
                        model: topo.model()
                    });
                }

                if (content) {
                    nodeTooltip.content(null);
                    content.attach(nodeTooltip);
                }

                var size = node.getBound(true);

                nodeTooltip.open({
                    target: pos,
                    offset: Math.max(size.height, size.width) / 2
                });

                this.fire("openNodeToolTip", node);
            },
            /**
             * Open a nodeSet's tooltip
             * @param nodeSet {nx.graphic.Topology.NodeSet}
             * @param position {Object}
             * @method openNodeSetTooltip
             */
            openNodeSetTooltip: function (nodeSet, position) {
                var topo = this.topology();
                var nodeSetTooltip = this.nodeSetTooltip();
                var content;

                nodeSetTooltip.close(true);

                if (this.showNodeSetTooltip() === false) {
                    return;
                }


                var pos = position || this._getNodeAbsolutePosition(nodeSet);

                var contentClass = nx.path(global, this.nodeSetTooltipContentClass());
                if (contentClass) {
                    content = new contentClass();
                    content.sets({
                        topology: topo,
                        nodeSet: nodeSet,
                        model: topo.graph()
                    });
                }

                if (content) {
                    nodeSetTooltip.content(null);
                    content.attach(nodeSetTooltip);
                }

                var size = nodeSet.getBound(true);

                nodeSetTooltip.open({
                    target: pos,
                    offset: Math.max(size.height, size.width) / 2
                });

                this.fire("openNodeSetToolTip", nodeSet);
            },
            /**
             * open a link's tooltip
             * @param link
             * @param position
             * @method openLinkTooltip
             */
            openLinkTooltip: function (link, position) {
                var topo = this.topology();
                var linkTooltip = this.linkTooltip();
                var content;

                linkTooltip.close(true);

                if (this.showLinkTooltip() === false) {
                    return;
                }

                var pos = position || link.centerPoint();

                var contentClass = nx.path(global, this.linkTooltipContentClass());
                if (contentClass) {
                    content = new contentClass();
                    content.sets({
                        topology: topo,
                        link: link,
                        model: topo.graph()
                    });
                }

                if (content) {
                    linkTooltip.content(null);
                    content.attach(linkTooltip);
                }

                linkTooltip.open({
                    target: pos,
                    offset: 4
                });

                this.fire("openLinkToolTip", link);
            },
            /**
             * Open linkSet tooltip
             * @method openLinkSetTooltip
             * @param linkSet
             * @param position
             */
            openLinkSetTooltip: function (linkSet, position) {
                var topo = this.topology();
                var linkSetTooltip = this.linkSetTooltip();
                var content;

                linkSetTooltip.close(true);

                if (this.showLinkSetTooltip() === false) {
                    return;
                }

                var pos = position || topo.getAbsolutePosition(linkSet.centerPoint());
                var stageBound = topo.view().dom().getBound();


                var contentClass = nx.path(global, this.linkSetTooltipContentClass());
                if (contentClass) {
                    content = new contentClass();
                    content.sets({
                        topology: topo,
                        linkSet: linkSet,
                        model: topo.graph()
                    });
                }

                if (content) {
                    linkSetTooltip.content(null);
                    content.attach(linkSetTooltip);
                }

                linkSetTooltip.open({
                    target: pos,
                    offsetX: 0,
                    offsetY: 8
                });


                this.fire("openLinkSetToolTip", linkSet);
            },
            /**
             * Close all tooltip
             * @method closeAll
             */
            closeAll: function () {
                this.tooltips().each(function (obj, name) {
                    obj.value.close(true);
                }, this);
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {

    /**
     * Basic scene class
     * @class nx.graphic.Topology.Scene
     * @extend nx.data.ObservableObject
     */
    nx.define("nx.graphic.Topology.Scene", nx.data.ObservableObject, {
        properties: {
            topology: {
                value: null
            }
        },
        methods: {
            init: function (args) {
                this.sets(args);
            },
            /**
             * Factory function ,entry of a scene
             * @method activate
             */
            activate: function () {

            },
            /**
             * Deactivate a scene
             * @method deactivate
             */
            deactivate: function () {

            }
        }
    });

})(nx, nx.util, nx.global);
(function (nx, util, global) {
    /**
     * Default Scene for topology
     * @class nx.graphic.Topology.DefaultScene
     * @extend nx.graphic.Topology.Scene
     */

    nx.define("nx.graphic.Topology.DefaultScene", nx.graphic.Topology.Scene, {
        events: [],
        methods: {
            __construct: function () {
                this._topo = this.topology();
                this._nodesLayer = this._topo.getLayer("nodes");
                this._nodeSetLayer = this._topo.getLayer("nodes");
                this._linksLayer = this._topo.getLayer("links");
                this._linkSetLayer = this._topo.getLayer("linkSet");
                this._tooltipManager = this._topo.tooltipManager();
                this._nodeDragging = false;
                this._sceneTimer = null;
                this._interval = 600;
            },
            /**
             * active scene
             * @method activate
             */

            activate: function () {
                this.__construct();
                var topo = this._topo;
                var tooltipManager = this._tooltipManager;

                tooltipManager.activated(true);

                nx.each(topo.__events__, this._aop = function (eventName) {
                    topo.upon(eventName, function (sender, data) {
                        tooltipManager.executeAction(eventName, data);
                        if (this[eventName]) {
                            this[eventName].call(this, sender, data);
                        }
                    }, this);
                }, this);
            },
            deactivate: function () {
                this._tooltipManager.closeAll();
            },

            _dispatch: function (eventName, sender, data) {
                if (this[eventName]) {
                    this._tooltipManager.executeAction(eventName, data);
                    this[eventName].call(this, sender, data);
                }
            },

            pressStage: function (sender, event) {
            },
            clickStage: function (sender, event) {
                if (event.target == this._topo.stage().view().dom().$dom) {
                    this._topo.selectedNodes().clear();
                }
            },

            dragStageStart: function (sender, event) {
                var nodes = this._topo.getLayer('nodes').nodes().length;
                if (nodes > 300) {
                    this._topo.getLayer('links').root().setStyle('display', 'none');
                }
                this._recover();
                this._blockEvent(true);
                nx.dom.Document.body().addClass('n-moveCursor');
            },
            dragStage: function (sender, event) {
                var stage = this._topo.stage();
                stage.setTransform(stage._translateX + event.drag.delta[0], stage._translateY + event.drag.delta[1]);
            },
            dragStageEnd: function (sender, event) {
                this._topo.getLayer('links').root().setStyle('display', 'block');
                this._blockEvent(false);
                nx.dom.Document.body().removeClass('n-moveCursor');
            },
            projectionChange: function () {

            },


            zooming: function () {
                var nodes = this._topo.getLayer('nodes').nodes().length;
                if (nodes > 300) {
                    this._topo.getLayer('links').root().setStyle('display', 'none');
                }
                this._nodesLayer.recover();
                this._linksLayer.recover();
                this._linkSetLayer.recover();
                this._topo.adjustLayout();

            },

            zoomend: function () {
                this._topo.getLayer('links').root().setStyle('display', 'block');
                this._topo.adjustLayout();
            },

            beforeSetData: function () {

            },

            afterSetData: function () {

            },


            insertData: function () {

            },


            ready: function () {

            },
            enterNode: function (sender, node) {
                clearTimeout(this._sceneTimer);
                if (!this._nodeDragging) {
                    this._sceneTimer = setTimeout(function () {
                        this._nodesLayer.highlightRelatedNode(node);
                    }.bind(this), this._interval);
//                    this._recover();
                }
                nx.dom.Document.body().addClass('n-dragCursor');
            },
            leaveNode: function (sender, node) {
                clearTimeout(this._sceneTimer);
                if (!this._nodeDragging) {
                    this._recover();
                }
                nx.dom.Document.body().removeClass('n-dragCursor');
            },

            hideNode: function (sender, node) {

            },
            /**
             * Start drag node handler
             * @param sender
             * @param node
             * @method dragNodeStart
             */
            dragNodeStart: function (sender, node) {
                this._nodeDragging = true;
                this._recover();
                this._blockEvent(true);
                nx.dom.Document.body().addClass('n-dragCursor');
            },
            /**
             * Drag node handler
             * @method dragNode
             */
            dragNode: function () {

            },
            /**
             * Drag node end handler
             * @method dragNodeEnd
             */
            dragNodeEnd: function () {
                this._nodeDragging = false;
                this._blockEvent(false);
                nx.dom.Document.body().removeClass('n-dragCursor');
            },

            pressNode: function (sender, node) {

            },
            clickNode: function (sender, node) {
                if (!this._nodeDragging) {
                    var selected = node.selected();
                    this._topo.selectedNodes().clear();
                    node.selected(!selected);
                }
            },
            selectNode: function (sender, node) {
                var selectedNodes = this._topo.selectedNodes();
                if (node.selected()) {
                    if (selectedNodes.indexOf(node) == -1) {
                        this._topo.selectedNodes().add(node);
                    }
                } else {
                    if (selectedNodes.indexOf(node) !== -1) {
                        this._topo.selectedNodes().remove(node);
                    }
                }
            },
            selectNodeSet: function (sender, nodeSet) {
                var selectedNodes = this._topo.selectedNodes();
                if (nodeSet.selected()) {
                    if (selectedNodes.indexOf(nodeSet) == -1) {
                        this._topo.selectedNodes().add(nodeSet);
                    }
                } else {
                    if (selectedNodes.indexOf(nodeSet) !== -1) {
                        this._topo.selectedNodes().remove(nodeSet);
                    }
                }
            },

            updateNodeCoordinate: function () {

            },

            pressNodeSet: function (sender, nodeSet) {

            },
            clickNodeSet: function (sender, nodeSet) {
                this._recover();
                nodeSet.collapsed(!!!nodeSet.collapsed());
            },

            enterNodeSet: function (sender, nodeSet) {
                clearTimeout(this._sceneTimer);
                if (!this._nodeDragging) {
                    this._sceneTimer = setTimeout(function () {
                        this._nodesLayer.highlightRelatedNode(nodeSet);
                    }.bind(this), this._interval);
                    this._recover();
                }
            },
            leaveNodeSet: function (sender, nodeSet) {
                clearTimeout(this._sceneTimer);
                if (!this._nodeDragging) {
                    this._recover();
                }
            },
            expandNodeSet: function (sender, nodeSet) {
                nodeSet.visible(false);
                clearTimeout(this._sceneTimer);
                this._recover();
                this._topo.adjustLayout();
            },
            enterLink: function (sender, events) {
            },
            collapseNodeSet: function (sender, nodeSet) {
                nodeSet.visible(true);
            },
            right: function (sender, events) {
                this._topo.move(30, null, 0.5);
            },
            left: function (sender, events) {
                this._topo.move(-30, null, 0.5);
            },
            up: function () {
                this._topo.move(null, -30, 0.5);
            },
            down: function () {
                this._topo.move(null, 30, 0.5);
            },
            topologyGenerated: function () {
                this._topo.adjustLayout();
            },
            _recover: function () {
                this._nodesLayer.recover();
                this._nodeSetLayer.recover();
                this._linksLayer.recover();
                this._linkSetLayer.recover();
            },
            _blockEvent: function (value) {
                if (value) {
                    nx.dom.Document.body().addClass('n-userselect n-blockEvent');
                } else {
                    nx.dom.Document.body().removeClass('n-userselect');
                    nx.dom.Document.body().removeClass('n-blockEvent');
                }
            }
        }
    });
})(nx, nx.util, nx.global);
(function (nx, util, global) {


    /**
     * Selection scene
     * @class nx.graphic.Topology.SelectionScene
     * @extend nx.graphic.Topology.Scene
     */
    nx.define("nx.graphic.Topology.SelectionScene", nx.graphic.Topology.DefaultScene, {
        methods: {
            /**
             * Entry
             * @method activate
             */

            activate: function (args) {
                this.appendRect();
                this.inherited(args);
            },
            /**
             * Deactivate scene
             */
            deactivate: function () {
                this.inherited();
                this.rect.dispose();
                delete this.rect;
            },
            _dispatch: function (eventName, sender, data) {
                if (this[eventName]) {
                    this[eventName].call(this, sender, data);
                }
            },
            appendRect: function () {
                var topo = this.topology();
                if (this.rect) {
                    this.rect.dispose();
                }
                var rect = this.rect = new nx.graphic.Rect({
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    'class': 'selectionRect'
                });
                rect.attach(topo.stage());
            },
            dragStageStart: function (sender, event) {
                this._offset = {
                    x: event.clientX,
                    y: event.clientY
                };
                var topo = this.topology();
                var stage = topo.stage();
                var rect = this.rect;
                this._stageBound = stage.view().dom().getBound();
                this._stageTranslate = stage.translate();
                rect.set('x', event.clientX - this._stageTranslate.x - this._stageBound.left);
                rect.set('y', event.clientY - this._stageTranslate.y - this._stageBound.top);
                this.rect.set('visible', true);
                this._blockEvent(true);

            },
            dragStage: function (sender, event) {
                var rect = this.rect;
                var width = event.clientX - this._offset.x;
                var height = event.clientY - this._offset.y;
                if (width < 0) {
                    rect.set('x', this._offset.x - this._stageTranslate.x - this._stageBound.left + width);
                    rect.set('width', width * -1);
                } else {
                    rect.set('width', width);
                }

                if (height < 0) {
                    rect.set('y', this._offset.y - this._stageTranslate.y - this._stageBound.top + height);
                    rect.set('height', height * -1);
                } else {
                    rect.set('height', height);
                }
            },
            dragStageEnd: function (sender, event) {
                this._offset = null;
                this._stageTranslate = null;
                this.rect.set('visible', false);
                this._blockEvent(false);
            },
            _getRectBound: function () {
                var rectbound = this.rect.getBoundingClientRect();
                var topoBound = this.topology().getBound();
                return {
                    top: rectbound.top - topoBound.top,
                    left: rectbound.left - topoBound.left,
                    width: rectbound.width,
                    height: rectbound.height,
                    bottom: rectbound.bottom - topoBound.top,
                    right: rectbound.right - topoBound.left
                };
            },
            esc: {

            },
            _blockEvent: function (value) {
                if (value) {
                    nx.dom.Document.body().addClass('n-userselect n-blockEvent');
                } else {
                    nx.dom.Document.body().removeClass('n-userselect');
                    nx.dom.Document.body().removeClass('n-blockEvent');
                }
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, global) {

    /**
     * Selection node scene
     * @class nx.graphic.Topology.SelectionNodeScene
     * @extend nx.graphic.Topology.SelectionScene
     */

    nx.define('nx.graphic.Topology.SelectionNodeScene', nx.graphic.Topology.SelectionScene, {
        properties: {
            /**
             * Get all selected nodes
             * @property selectedNodes
             */
            selectedNodes: {
                get: function () {
                    return this.topology().selectedNodes();
                }
            }
        },
        methods: {

            activate: function () {
                this.inherited();
                var tooltipManager = this._tooltipManager;
                tooltipManager.activated(false);
            },


            pressStage: function (sender,event) {
                var selectedNodes = this.selectedNodes();
                var multi = this._multi = event.metaKey || event.ctrlKey;
                if (!multi) {
                    selectedNodes.clear();
                }
            },
            enterNode: function () {

            },
            clickNode: function (sender, node) {
            },
            dragStageStart: function (sender, event) {
                this.inherited(sender, event);
                var selectedNodes = this.selectedNodes();
                var multi = this._multi = event.metaKey || event.ctrlKey;
                if (!multi) {
                    selectedNodes.clear();
                }
                this._prevSelectedNodes = this.selectedNodes().toArray().slice();
                var bounds = this.bounds = [];
                this.topology().eachNode(function (node) {
                    if (node.enable()) {
                        var bound = node.getBound(true);
                        bounds.push({
                            bound: bound,
                            node: node
                        });
                    }
                }, this);
            },
            dragStage: function (sender, event) {
                this.inherited(sender, event);
                this.selectNodeByRect(this.rect.getBound());
            },
            selectNode: function (sender, node) {
                if (node.selected()) {
                    this._topo.selectedNodes().add(node);
                } else {
                    this._topo.selectedNodes().remove(node);
                }
            },
            selectNodeSet: function (sender, nodeset) {
                if (nodeset.selected()) {
                    this._topo.selectedNodes().add(nodeset);
                } else {
                    this._topo.selectedNodes().remove(nodeset);
                }
            },


            pressNode: function (sender, node) {
                if (node.enable()) {
                    var selectedNodes = this.selectedNodes();
                    var multi = this._multi = event.metaKey || event.ctrlKey;
                    if (!this._multi) {
                        selectedNodes.clear();
                    }
                    node.selected(!node.selected());
                }
            },
            selectNodeByRect: function (bound) {
                nx.each(this.bounds, function (item) {
                    var nodeBound = item.bound;
                    var node = item.node;
                    var nodeSelected = node.selected();
                    if (this._hittest(bound, nodeBound)) {
                        if (!nodeSelected) {
                            node.selected(true);
                        }
                    } else {
                        if (this._multi) {
                            if (this._prevSelectedNodes.indexOf(node) == -1) {
                                if (nodeSelected) {
                                    node.selected(false);
                                }
                            }
                        } else {
                            if (nodeSelected) {
                                node.selected(false);
                            }
                        }
                    }
                }, this);
            },
            _hittest: function (rect, nodeBound) {
                var t = rect.top <= nodeBound.top && nodeBound.top <= rect.bottom,
                    l = rect.left <= nodeBound.left && nodeBound.left <= rect.right,
                    b = rect.bottom >= nodeBound.bottom && nodeBound.bottom >= rect.top,
                    r = rect.right >= nodeBound.right && nodeBound.right >= rect.left,
                    hm = rect.top >= nodeBound.top && rect.bottom <= nodeBound.bottom,
                    vm = rect.left >= nodeBound.left && rect.right <= nodeBound.right;

                return (t && l) || (b && r) || (t && r) || (b && l) || (t && vm) || (b && vm) || (l && hm) || (r && hm);
            }
        }
    });

})(nx, nx.global);
(function (nx, util, global) {

    /**
     * Zoom by selection scene
     * @class nx.graphic.Topology.ZoomBySelection
     * @extend nx.graphic.Topology.SelectionScene
     */
    nx.define("nx.graphic.Topology.ZoomBySelection", nx.graphic.Topology.SelectionScene, {
        events: ['finish'],
        properties: {
        },
        methods: {
            dragStageEnd: function (sender, event) {
                var bound = this.rect.getBound();
                this.inherited(sender, event);
                this.fire('finish', bound);
            },
            esc: function () {
                this.fire('finish');
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, global) {


    var shapeMap = {
        'rect': 'nx.graphic.Topology.RectGroup',
        'circle': 'nx.graphic.Topology.CircleGroup',
        'polygon': 'nx.graphic.Topology.PolygonGroup'
    };


    var colorTable = ['#C3A5E4', '#75C6EF', '#CBDA5C', '#ACAEB1 ', '#2CC86F'];


    /**
     * Topology group layer class

     var groupsLayer = topo.getLayer('groups');
     var nodes1 = [sender.getNode(0), sender.getNode(1)];
     var group1 = groupsLayer.addGroup({
                    nodes: nodes1,
                    label: 'Rect',
                    color: '#f00'
                });
     group1.on('clickGroupLabel', function (sender, events) {
                    console.log(group1.nodes().toArray());
                }, this);

     *
     * @class nx.graphic.Topology.GroupsLayer
     * @extend nx.graphic.Topology.Layer
     * @module nx.graphic.Topology
     */

    nx.define('nx.graphic.Topology.GroupsLayer', nx.graphic.Topology.Layer, {
        statics: {
            /**
             * Default color table, with 5 colors
             * @property colorTable
             * @static
             */
            colorTable: colorTable
        },
        events: [],
        properties: {
            /**
             * Groups collection
             * @property groups {Array}
             */
            groups: {
                value: function () {
                    return [];
                }
            }
        },
        view: {
            type: 'nx.graphic.Group'
        },
        methods: {

            /**
             * Register a group item class
             * @param name {String} group items' name
             * @param className {Object} which should extend nx.graphic.Topology.GroupItem
             */
            registerGroupItem: function (name, className) {
                shapeMap[name] = className;
            },


            attach: function (args) {
                this.inherited(args);
                var topo = this.topology();
                topo.on('resetzooming', this._draw, this);
                topo.on('zoomend', this._draw, this);

            },
            /**
             * Add a group to group layer
             * @param obj {Object} config of a group
             * @returns {GroupClass}
             */
            addGroup: function (obj) {
                var groups = this.groups();
                var shape = obj.shapeType || 'rect';
                var nodes = obj.nodes;

                var GroupClass = nx.path(global, shapeMap[shape]);
                var group = new GroupClass({
                    'topology': this.topology()
                });

                var config = nx.clone(obj);
                if (!config.color) {
                    config.color = colorTable[groups.length % 5];
                }
                delete  config.nodes;
                delete  config.shapeType;

                group.sets(config);
                group.nodes().addRange(nodes);


                group.draw();
                group.attach(this);
                this.groups().push(group);

                return group;

            },
            /**
             * Re-draw all group, for update
             * @method reDrawAllGroup
             */
            reDrawAllGroup: function () {
                nx.each(this.groups(), function (group) {
                    group.draw();
                }, this);
            },
            _draw: function () {
                this.reDrawAllGroup();
            },
            clear: function () {
                nx.each(this.groups(), function (group) {
                    group.dispose();
                }, this);
                this.groups([]);

                var topo = this.topology();
                topo.off('resetzooming', this.reDrawAllGroup, this);
                topo.off('zoomend', this.reDrawAllGroup, this);
                this.clear.__super__.apply(this, arguments);
            }

        }
    });


})(nx, nx.global);
(function (nx, global) {

    /**
     *
     * Base group shape class
     * @class nx.graphic.Topology.GroupItem
     * @extend nx.graphic.Component
     * @module nx.graphic.Topology.Group
     *
     */


    nx.define("nx.graphic.Topology.GroupItem", nx.graphic.Component, {
        events: [],
        properties: {
            /**
             * Topology
             * @property topology
             * @readyOnly
             */
            topology: {

            },
            /**
             * Node array in the shape
             * @property nodes {nx.data.ObservableCollection}
             */
            nodes: {
                value: function () {
                    return new nx.data.ObservableCollection();
                }
            },
            /**
             * Shape's color
             * @property color
             */
            color: {

            },
            /**
             * Group's label
             * @property label
             */
            label: {

            }
        },
        view: {

        },
        methods: {
            init: function (args) {

                this.inherited(args);

                var nodes = this.nodes();

                nodes.on('change', function (sender, args) {
                    var action = args.action;
                    var items = args.items;

                    if (action == 'add') {

                        nx.each(items, function (node) {
                            node.on('updateNodeCoordinate', this.draw, this);
                        }, this);

                        this.draw();

                    } else if (action == 'remove') {
                        nx.each(items, function (node) {
                            node.off('updateNodeCoordinate', this.draw, this);
                        }, this);

                        this.draw();
                    } else if (action == 'clear') {
                        nx.each(items, function (node) {
                            node.off('updateNodeCoordinate', this.draw, this);
                        }, this);

                        this.dispose();
                    }
                }, this);

            },
            draw: function () {
            },
            dispose: function () {
                nx.each(this.nodes().toArray(), function (node) {
                    node.off('updateNodeCoordinate', this.draw, this);
                }, this);
                this.dispose.__super__.apply(this, arguments);
            }
        }
    });


})(nx, nx.global);
(function (nx, global) {

    /**
     * Rectangle shape group class
     * @class nx.graphic.Topology.RectGroup
     * @extend nx.graphic.Topology.GroupItem
     * @module nx.graphic.Topology.Group
     *
     */


    nx.define('nx.graphic.Topology.RectGroup', nx.graphic.Topology.GroupItem, {
        events: ["dragGroupStart", "dragGroup", "dragGroupEnd", "clickGroupLabel"],
        view: {
            type: 'nx.graphic.Group',
            props: {
                'class': 'group'
            },
            content: [
                {
                    name: 'shape',
                    type: 'nx.graphic.Rect',
                    props: {
                        'class': 'bg'
                    },
                    events: {
                        'mousedown': '{#_mousedown}',
                        'dragstart': '{#_dragstart}',
                        'dragmove': '{#_drag}',
                        'dragend': '{#_dragend}'
                    }
                },
                {
                    name: 'text',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'groupLabel',
                        text: '{#label}'
                    },
                    events: {
                        'click': '{#_clickLabel}'
                    }
                }
            ]
        },
        properties: {
        },
        methods: {

            draw: function () {
                var topo = this.topology();
                var translate = topo.stage().translate();
                var bound = topo.getBoundByNodes(this.nodes().toArray());

                var shape = this.view('shape');
                shape.sets({
                    x: bound.left - translate.x,
                    y: bound.top - translate.y,
                    width: bound.width,
                    height: bound.height,
                    fill: this.color(),
                    stroke: this.color()
                });


                var text = this.view('text');
                text.sets({
                    x: bound.left - translate.x + bound.width / 2,
                    y: bound.top - translate.y - 6
                });
                text.view().dom().setStyle('fill', this.color());
            },
            _clickLabel: function (sender, event) {
                /**
                 * Fired when click group label
                 * @event clickGroupLabel
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('clickGroupLabel');
            },
            _mousedown: function (sender, event) {
                event.captureDrag(this.view('shape'));
            },
            _dragstart: function (sender, event) {
                /**
                 * Fired when start drag a group
                 * @event dragGroupStart
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroupStart', event);
            },
            _drag: function (sender, event) {
                /**
                 * Fired when dragging a group
                 * @event dragGroup
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroup', event);
                this._updateNodesPosition(event.drag.delta[0], event.drag.delta[1]);
            },
            _dragend: function (sender, event) {
                /**
                 * Fired finish dragging
                 * @event dragGroupEnd
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroupEnd', event);
            },
            _updateNodesPosition: function (x, y) {
                this.nodes().each(function (node) {
                    node.move(x, y);
                });
            }
        }
    });


})(nx, nx.global);
(function (nx, global) {
    /**
     * Circle shape group class
     * @class nx.graphic.Topology.CircleGroup
     * @extend nx.graphic.Topology.GroupItem
     * @module nx.graphic.Topology.Group
     *
     */
    nx.define('nx.graphic.Topology.CircleGroup', nx.graphic.Topology.GroupItem, {
        events: ["dragGroupStart", "dragGroup", "dragGroupEnd", "clickGroupLabel"],
        view: {
            type: 'nx.graphic.Group',
            props: {
                'class': 'group'
            },
            content: [
                {
                    name: 'shape',
                    type: 'nx.graphic.Circle',
                    props: {
                        'class': 'bg'
                    },
                    events: {
                        'mousedown': '{#_mousedown}',
                        'dragstart': '{#_dragstart}',
                        'dragmove': '{#_drag}',
                        'dragend': '{#_dragend}'
                    }
                },
                {
                    name: 'text',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'groupLabel',
                        text: '{#label}'
                    },
                    events: {
                        'click': '{#_clickLabel}'
                    }
                }
            ]
        },
        properties: {
        },
        methods: {

            draw: function () {
                var topo = this.topology();
                var translate = topo.stage().translate();
                var bound = topo.getBoundByNodes(this.nodes().toArray());
                var radius = Math.sqrt(Math.pow(bound.width / 2, 2) + Math.pow(bound.height / 2, 2));

                var shape = this.view('shape');
                shape.sets({
                    cx: bound.left - translate.x + bound.width / 2,
                    cy: bound.top - translate.y + bound.height / 2,
                    r: radius,
                    fill: this.color(),
                    stroke: this.color()
                });


                var text = this.view('text');
                text.sets({
                    x: bound.left - translate.x + bound.width / 2,
                    y: bound.top - translate.y + bound.height / 2 - radius - 6
                });
                text.view().dom().setStyle('fill', this.color());
            },
            _clickLabel: function (sender, event) {
                /**
                 * Fired when click group label
                 * @event clickGroupLabel
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('clickGroupLabel');
            },
            _mousedown: function (sender, event) {
                event.captureDrag(this.view('shape'));
            },
            _dragstart: function (sender, event) {
                /**
                 * Fired when start drag a group
                 * @event dragGroupStart
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroupStart', event);
            },
            _drag: function (sender, event) {
                /**
                 * Fired when dragging a group
                 * @event dragGroup
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroup', event);
                this._updateNodesPosition(event.drag.delta[0], event.drag.delta[1]);
            },
            _dragend: function (sender, event) {
                /**
                 * Fired finish dragging
                 * @event dragGroupEnd
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroupEnd', event);
            },
            _updateNodesPosition: function (x, y) {
                this.nodes().each(function (node) {
                    node.move(x, y);
                });
            }
        }
    });


})(nx, nx.global);
(function (nx, global) {


    /**
     * Polygon shape group class
     * @class nx.graphic.Topology.PolygonGroup
     * @extend nx.graphic.Topology.GroupItem
     * @module nx.graphic.Topology.Group
     *
     */

    nx.define('nx.graphic.Topology.PolygonGroup', nx.graphic.Topology.GroupItem, {
        events: ["dragGroupStart", "dragGroup", "dragGroupEnd", "clickGroupLabel"],
        view: {
            type: 'nx.graphic.Group',
            props: {
                'class': 'group'
            },
            content: [
                {
                    name: 'shape',
                    type: 'nx.graphic.Polygon',
                    props: {
                        'class': 'bg'
                    },
                    events: {
                        'mousedown': '{#_mousedown}',
                        'dragstart': '{#_dragstart}',
                        'dragmove': '{#_drag}',
                        'dragend': '{#_dragend}'
                    }
                },
                {
                    name: 'text',
                    type: 'nx.graphic.Text',
                    props: {
                        'class': 'groupLabel',
                        text: '{#label}'
                    },
                    events: {
                        'click': '{#_clickLabel}'
                    }
                }
            ]
        },
        properties: {
        },
        methods: {

            draw: function () {
                var topo = this.topology();
                var translate = topo.stage().translate();
                var bound = topo.getBoundByNodes(this.nodes().toArray());
                bound.left -= translate.x;
                bound.top -= translate.y;

                var shape = this.view('shape');
                shape.sets({
                    fill: this.color(),
                    stroke: this.color()
                });

                var vectorArray = [];
                this.nodes().each(function (node) {
                    vectorArray.push({x: node.x(), y: node.y()});
                });

                shape.nodes(vectorArray);
                shape.setStyle('stroke-width',60);


                var text = this.view('text');
                text.sets({
                    x: bound.left + bound.width / 2,
                    y: bound.top - 3
                });
                text.view().dom().setStyle('fill', this.color());
            },
            _clickLabel: function (sender, event) {
                /**
                 * Fired when click group label
                 * @event clickGroupLabel
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('clickGroupLabel');
            },
            _mousedown: function (sender, event) {
                event.captureDrag(this.view('shape'));
            },
            _dragstart: function (sender, event) {
                /**
                 * Fired when start drag a group
                 * @event dragGroupStart
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroupStart', event);
            },
            _drag: function (sender, event) {
                /**
                 * Fired when dragging a group
                 * @event dragGroup
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroup', event);
                this._updateNodesPosition(event.drag.delta[0], event.drag.delta[1]);
            },
            _dragend: function (sender, event) {
                /**
                 * Fired finish dragging
                 * @event dragGroupEnd
                 * @param sender{Object} trigger instance
                 * @param event {Object} original event object
                 */
                this.fire('dragGroupEnd', event);
            },
            _updateNodesPosition: function (x, y) {
                this.nodes().each(function (node) {
                    node.move(x, y);
                });
            }
        }
    });


})(nx, nx.global);
(function (nx, global) {

    var Vector = nx.math.Vector;
    var Line = nx.math.Line;
    var colorIndex = 0;
    var colorTable = ['#b2e47f', '#e4e47f', '#bec2f9', '#b6def7', '#89f0de'];
    /**
     * A topology path class
     Path's background colors : ['#b2e47f', '#e4e47f', '#bec2f9', '#b6def7', '#89f0de']
     * @class nx.graphic.Topology.Path
     * @extend nx.graphic.Component
     * @module nx.graphic.Topology
     */

    nx.define("nx.graphic.Topology.Path", nx.graphic.Component, {
        view: {
            type: 'nx.graphic.Group',
            content: {
                name: 'path',
                type: 'nx.graphic.Path'
            }
        },
        properties: {
            /**
             * get/set links's style ,default value is
             value: {
                    'stroke': '#666',
                    'stroke-width': '1px'
                }

             * @property pathStyle
             */
            pathStyle: {
                value: {
                    'stroke': '#666',
                    'stroke-width': '0px'
                }
            },
            /**
             * Get/set a path's width
             * @property pathWidth
             */
            pathWidth: {
                value: "auto"
            },
            /**
             * Get/set a path's gutter
             * @property pathGutter
             */
            pathGutter: {
                value: 13
            },
            /**
             * Get/set a path's padding to a node
             * @property pathPadding
             */
            pathPadding: {
                value: "auto"
            },
            /**
             * Get/set path arrow type , 'none'/'cap'/'full'/'end'
             * @property
             */
            arrow: {
                value: 'none'
            },
            /**
             * Get/set links to draw a path pver it
             * @property links
             */
            links: {
                value: function () {
                    return [];
                }

            },
            /**
             * Reverse path direction
             * @property reverse
             */
            reverse: {
                value: false
            },
            owner: {

            }
        },
        methods: {
            init: function (props) {
                this.inherited(props);
                var pathStyle = this.pathStyle();
                this.resolve("path").sets(pathStyle);

                if (!pathStyle.fill) {
                    this.resolve("path").setStyle("fill", colorTable[colorIndex++ % 5]);
                }


                var nodes = this.nodes = {};
                nx.each(this.links(), function (link) {
                    nodes[link.sourceNodeID()] = link.sourceNode();
                    nodes[link.targetNodeID()] = link.targetNode();
                });

                nx.each(nodes, function (node) {
                    node.on('updateNodeCoordinate', this.draw, this);
                }, this);


            },
            /**
             * Draw a path,internal
             * @method draw
             */
            draw: function () {
                var link, line1, line2, pt, d1 = [], d2 = [];
                var pathWidth = this.pathWidth();
                var pathPadding = this.pathPadding();
                var paddingStart, paddingEnd;
                var arrow = this.arrow();
                var v1, v2;


                var links = this.links();
                var linksSequentialArray = this._serializeLinks();
                var count = links.length;

                //first
                var firstLink = links[0];

                var gutter = firstLink.getGutter();
                if (firstLink.reverse()) {
                    gutter *= -1;
                }

                gutter = new Vector(0, this.reverse() ? gutter * -1 : gutter);

                line1 = linksSequentialArray[0].translate(gutter);

                if (pathPadding === "auto") {
                    paddingStart = Math.min(firstLink.sourceNode().showIcon() ? 24 : 4, line1.length() / 4);
                    paddingEnd = Math.min(firstLink.targetNode().showIcon() ? 24 : 4, line1.length() / 4);
                }
                else if (nx.is(pathPadding, 'Array')) {
                    paddingStart = pathPadding[0];
                    paddingEnd = pathPadding[1];
                }
                else {
                    paddingStart = paddingEnd = pathPadding;
                }
                if (typeof paddingStart == 'string' && paddingStart.indexOf('%') > 0) {
                    paddingStart = line1.length() * parseInt(paddingStart, 10) / 100;
                }

                if (pathWidth === "auto") {
                    pathWidth = Math.min(10, Math.max(3, Math.round(firstLink.topology().scale() * 3)));
                }
                v1 = new Vector(0, pathWidth / 2);
                v2 = new Vector(0, -pathWidth / 2);

                pt = line1.translate(v1).pad(paddingStart, 0).start;
                d1.push('M', pt.x, pt.y);
                pt = line1.translate(v2).pad(paddingStart, 0).start;
                d2.unshift('L', pt.x, pt.y, 'Z');

                if (links.length > 1) {
                    for (var i = 1; i < count; i++) {
                        link = links[i];
                        line2 = linksSequentialArray[i].translate(new Vector(0, link.getGutter()));
                        pt = line1.translate(v1).intersection(line2.translate(v1));

                        if (isFinite(pt.x) && isFinite(pt.y)) {
                            d1.push('L', pt.x, pt.y);
                        }
                        pt = line1.translate(v2).intersection(line2.translate(v2));
                        if (isFinite(pt.x) && isFinite(pt.y)) {
                            d2.unshift('L', pt.x, pt.y);
                        }
                        line1 = line2;
                    }
                } else {
                    line2 = line1;
                }

                if (typeof paddingEnd == 'string' && paddingEnd.indexOf('%') > 0) {
                    paddingEnd = line2.length() * parseInt(paddingEnd, 10) / 100;
                }

                if (arrow == 'cap') {
                    pt = line2.translate(v1).pad(0, 2.5 * pathWidth + paddingEnd).end;
                    d1.push('L', pt.x, pt.y);
                    pt = pt.add(line2.normal().multiply(pathWidth / 2));
                    d1.push('L', pt.x, pt.y);

                    pt = line2.translate(v2).pad(0, 2.5 * pathWidth + paddingEnd).end;
                    d2.unshift('L', pt.x, pt.y);
                    pt = pt.add(line2.normal().multiply(-pathWidth / 2));
                    d2.unshift('L', pt.x, pt.y);

                    pt = line2.pad(0, paddingEnd).end;
                    d1.push('L', pt.x, pt.y);
                }
                else if (arrow == 'end') {
                    pt = line2.translate(v1).pad(0, 2 * pathWidth + paddingEnd).end;
                    d1.push('L', pt.x, pt.y);

                    pt = line2.translate(v2).pad(0, 2 * pathWidth + paddingEnd).end;
                    d2.unshift('L', pt.x, pt.y);

                    pt = line2.pad(0, paddingEnd).end;
                    d1.push('L', pt.x, pt.y);
                }
                else if (arrow == 'full') {
                    pt = line2.pad(0, paddingEnd).end;
                    d1.push('L', pt.x, pt.y);
                }
                else {
                    pt = line2.translate(v1).pad(0, paddingEnd).end;
                    d1.push('L', pt.x, pt.y);
                    pt = line2.translate(v2).pad(0, paddingEnd).end;
                    d2.unshift('L', pt.x, pt.y);
                }

                this.resolve("path").set('d', d1.concat(d2).join(' '));


                //todo
//                if (links.length == 1) {
//                    firstLink.resolve().watch("opacity", function (prop, value) {
//                        if (this.$ && this.resolve("path") && this.resolve("path").opacity) {
//                            this.resolve("path").opacity(value);
//                        }
//                    }, this);
//                }
            },

            _serializeLinks: function () {
                var value = this.links();
                var linksSequentialArray = [];

                var isEqual = this.isEqual;


                var firstItem = value[0];
                var secondItem = value[1];

                var firstItemSourceVector, firstItemTargetVector;

                firstItemSourceVector = firstItem.sourceVector();
                firstItemTargetVector = firstItem.targetVector();

//                if (firstItem.reverse()) {
//                    firstItemTargetVector = firstItem.sourceVector();
//                    firstItemSourceVector = firstItem.targetVector();
//                } else {
//
//                }


                if (secondItem) {
                    // todo reverse

                    var secondItemSourceVector, secondItemTargetVector;

                    if (secondItem.reverse()) {
                        secondItemTargetVector = secondItem.sourceVector();
                        secondItemSourceVector = secondItem.targetVector();
                    } else {
                        secondItemSourceVector = secondItem.sourceVector();
                        secondItemTargetVector = secondItem.targetVector();
                    }


                    if (isEqual(firstItemTargetVector, secondItemSourceVector) || isEqual(firstItemTargetVector, secondItemTargetVector)) {
                        linksSequentialArray.push(new Line(firstItemSourceVector, firstItemTargetVector));
                    } else {
                        linksSequentialArray.push(new Line(firstItemTargetVector, firstItemSourceVector));
                    }


                    if (isEqual(linksSequentialArray[0].end, secondItemSourceVector)) {
                        linksSequentialArray.push(new Line(secondItemSourceVector, secondItemTargetVector));
                    } else {
                        linksSequentialArray.push(new Line(secondItemTargetVector, secondItemSourceVector));
                    }

                    var lastTargetVector = linksSequentialArray[1].end;


                    for (var i = 2; i < value.length; i++) {

                        var link = value[i];


                        var sourceVector, targetVector;

                        if (link.reverse()) {
                            targetVector = link.sourceVector();
                            sourceVector = link.targetVector();
                        } else {
                            sourceVector = link.sourceVector();
                            targetVector = link.targetVector();
                        }

                        if (isEqual(sourceVector, lastTargetVector)) {
                            linksSequentialArray.push(new Line(sourceVector, targetVector));
                            lastTargetVector = targetVector;
                        } else {
                            linksSequentialArray.push(new Line(targetVector, sourceVector));
                            lastTargetVector = sourceVector;
                        }


                    }


                } else {
                    if (!this.reverse()) {
                        linksSequentialArray.push(new Line(firstItemSourceVector, firstItemTargetVector));
                    } else {
                        linksSequentialArray.push(new Line(firstItemTargetVector, firstItemSourceVector));
                    }

                }

                return linksSequentialArray;

            },
            isEqual: function (pos1, pos2) {

                return pos1.x == pos2.x && pos1.y == pos2.y;


            },
            dispose: function () {
                nx.each(this.nodes, function (node) {
                    node.off('updateNodeCoordinate', this.draw, this);
                }, this);
                this.dispose.__super__.apply(this, arguments);
            }


        }


    });


})(nx, nx.global);
(function (nx, global) {

    /**
     * Path layer class
     Could use topo.getLayer("pathLayer") get this
     * @class nx.graphic.Topology.PathLayer
     * @extend nx.graphic.Topology.Layer
     * @module nx.graphic.Topology
     */
    nx.define("nx.graphic.Topology.PathLayer", nx.graphic.Topology.Layer, {
        properties: {

            /**
             * Path array
             * @property paths
             */
            paths: {
                value: function () {
                    return[];
                }
            }
        },
        view: {
            type: 'nx.graphic.Group'
        },
        methods: {
            attach: function (args) {
                this.attach.__super__.apply(this, arguments);
                var topo = this.topology();
                topo.on('resetzooming', this._draw, this);
                topo.on('zoomend', this._draw, this);

            },
            _draw: function () {
                nx.each(this.paths(), function (path) {
                    path.draw();
                });
            },
            /**
             * Add a path to topology
             * @param path {nx.graphic.Topology.Path}
             * @method addPath
             */
            addPath: function (path) {
                this.paths().push(path);
                path.attach(this);
                path.draw();

                //
            },
            /**
             * Remove a path
             * @method removePath
             * @param path
             */
            removePath: function (path) {
                var index = util.indexOf(this._paths, path);
                this._paths.splice(index, 1);
                path.detach(this);
            },
            clear: function () {
                this.paths([]);

                var topo = this.topology();
                topo.on('resetzooming', this._draw, this);
                topo.on('zoomend', this._draw, this);

                this.clear.__super__.apply(this, arguments);
            }
        }
    });


})(nx, nx.global);
(function (nx, util, global) {


    nx.define("nx.graphic.Topology.Nav", nx.ui.Component, {
        properties: {
            topology: {
                get: function () {
                    return this.owner();
                }
            },
            scale: {},
            showIcon: {
                value: false
            },
            visible: {
                get: function () {
                    return this._visible !== undefined ? this._visible : true;
                },
                set: function (value) {
                    this.resolve('@root').setStyle("display", value ? "" : "none");
                    this.resolve('@root').setStyle("pointer-events", value ? "all" : "none");
                    this._visible = value;
                }
            }
        },

        view: {
            props: {
                'class': 'n-topology-nav'
            },
            content: [
                {
                    tag: "ul",
                    content: [
                        {
                            tag: 'li',
                            content: {
                                name: 'mode',
                                tag: 'ul',
                                props: {
                                    'class': 'n-topology-nav-mode'
                                },
                                content: [
                                    {
                                        name: 'selectionMode',
                                        tag: 'li',
                                        content: {
                                            props: {
                                                'class': 'glyphicon glyphicon-edit',
                                                style: '-webkit-transform: rotate(90deg)',
                                                title: "Select node mode"
                                            },
                                            tag: 'span'
                                        },
                                        events: {
                                            'mousedown': '{#_switchSelectionMode}',
                                            'touchstart': '{#_switchSelectionMode}'
                                        }

                                    },
                                    {
                                        name: 'moveMode',
                                        tag: 'li',
                                        props: {
                                            'class': 'n-topology-nav-mode-selected'
                                        },
                                        content: {
                                            props: {
                                                'class': 'glyphicon glyphicon-move',
                                                title: "Move mode"

                                            },
                                            tag: 'span'
                                        },
                                        events: {
                                            'mousedown': '{#_switchMoveMode}',
                                            'touchstart': '{#_switchMoveMode}'
                                        }

                                    }
                                ]
                            }
                        },
                        {
                            tag: 'li',
                            props: {
                                'class': 'n-topology-nav-zoom'
                            },
                            content: [
                                {
                                    tag: 'span',
                                    props: {
                                        'class': 'n-topology-nav-zoom-bar'
                                    }
                                },
                                {
                                    name: 'zoomout',
                                    tag: 'span',
                                    props: {
                                        'class': 'n-topology-nav-zoom-out glyphicon glyphicon-plus',
                                        title: "Zoom out"
                                    },
                                    events: {
                                        'click': '{#_out}'
                                    }
                                },
                                {
                                    name: 'zoomball',
                                    tag: 'span',
                                    props: {
                                        'class': 'n-topology-nav-zoom-ball',
                                        style: {
                                            top: 90
                                        }
                                    }
                                },
                                {
                                    name: 'zoomin',
                                    tag: 'span',
                                    props: {
                                        'class': 'n-topology-nav-zoom-in glyphicon glyphicon-minus',
                                        title: "Zoom in"
                                    },
                                    events: {
                                        'click': '{#_in}'
                                    }
                                }

                            ]
                        },
                        {
                            tag: 'li',
                            name: 'zoomselection',
                            props: {
                                'class': 'n-topology-nav-zoom-selection glyphicon glyphicon-zoom-in',
                                title: "Zoom by selection"
                            },
                            events: {
                                'click': '{#_zoombyselection}'
                            }
                        },
                        {
                            tag: 'li',
                            name: 'fit',
                            props: {
                                'class': 'n-topology-nav-fit glyphicon glyphicon-fullscreen',
                                title: "Fit stage"
                            },
                            events: {
                                'click': '{#_fit}'
                            }
                        },
//                        {
//                            tag: 'li',
//                            name: 'agr',
//                            props: {
//                                'class': 'n-icon-thumbnail-collapse-x16 n-topology-nav-agr',
//                                title: "Aggregation",
//                                visible: false
//                            },
//                            events: {
//                                'click': '{#_agr}'
//                            }
//                        },

                        {
                            tag: 'li',
                            name: 'fullscreen',
                            props: {
                                'class': 'n-topology-nav-full glyphicon glyphicon-export',
                                title: 'Enter full screen mode'
                            },
                            events: {
                                'click': '{#_full}'
                            }
                        },
                        {
                            tag: 'li',
                            name: 'setting',
                            content: [
                                {
                                    name: 'icon',
                                    tag: 'span',
                                    props: {
                                        'class': 'n-topology-nav-setting-icon glyphicon glyphicon-cog'
                                    },
                                    events: {
                                        mouseenter: "{#_openPopover}",
                                        mouseleave: "{#_closePopover}"
                                    }
                                },
                                {
                                    name: 'settingPopover',
                                    type: 'nx.ui.Popover',
                                    props: {
                                        title: 'Topology Setting',
                                        direction: "right",
                                        lazyClose: true
                                    },
                                    content: [
                                        {
                                            tag: 'h5',
                                            content: "Display icons as dots :"
                                        },
                                        {
                                            tag: 'label',
                                            content: [
                                                {
                                                    tag: 'input',
                                                    props: {
                                                        type: 'radio',
                                                        checked: '{#showIcon,converter=inverted,direction=<>}'
                                                    }
                                                },
                                                {
                                                    tag: 'span',
                                                    content: "Always"
                                                }
                                            ],
                                            props: {
                                                'class': 'radio-inline'
                                            }
                                        },
                                        {
                                            tag: 'label',
                                            content: [
                                                {
                                                    tag: 'input',
                                                    props: {
                                                        type: 'radio',
                                                        checked: '{#showIcon,direction=<>}'
                                                    }
                                                },
                                                {
                                                    tag: 'span',
                                                    content: "Auto-resize"
                                                }
                                            ],
                                            props: {
                                                'class': 'radio-inline'
                                            }
                                        },
                                        {
                                            tag: 'h5',
                                            content: "Theme :"
                                        },
                                        {

                                            props: {
                                                'class': 'btn-group'
                                            },
                                            content: [
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-default',
                                                        value: 'blue'
                                                    },
                                                    content: "Blue"
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-default',
                                                        value: 'green'
                                                    },
                                                    content: "Green"
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-default',
                                                        value: 'dark'
                                                    },
                                                    content: "Dark"
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-default',
                                                        value: 'slate'
                                                    },
                                                    content: "Slate"
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-default',
                                                        value: 'yellow'
                                                    },
                                                    content: "Yellow"
                                                }

                                            ],
                                            events: {
                                                'click': '{#_switchTheme}'
                                            }
                                        },
                                        {
                                            name: 'customize'
                                        }
                                    ],
                                    events: {
                                        'open': '{#_openSettingPanel}',
                                        'close': '{#_closeSettingPanel}'
                                    }
                                }
                            ],
                            props: {
                                'class': 'n-topology-nav-setting'
                            }
                        }
                    ]
                }
            ]
        },
        methods: {
            init: function (args) {
                this.inherited(args);


//                this.scaleTootip = new nx.ui.Tooltip({
//                    direction: "right"
//                });

                this.view('settingPopover').view().dom().addClass('n-topology-setting-panel');


                if (window.top.frames.length) {
                    this.view("fullscreen").style().set("display", 'none');
                }
            },
            attach: function (args) {
                this.inherited(args);
                var topo = this.topology();
                topo.watch('scale', function (prop, scale) {
                    var maxScale = topo.maxScale();
                    var minScale = topo.minScale();
                    var navBall = this.resolve("zoomball").resolve('@root');
                    var step = 65 / (maxScale - minScale);
                    navBall.setStyles({
                        top: 72 - (scale - minScale) * step + 14
                    });
                }, this);
                topo.notify('scale');
            },
            _switchSelectionMode: function (sender, event) {
                this.view("selectionMode").dom().addClass("n-topology-nav-mode-selected");
                this.view("moveMode").dom().removeClass("n-topology-nav-mode-selected");

                var topo = this.topology();
                var currentSceneName = topo.currentSceneName();
                if (currentSceneName != 'selection') {
                    topo.activateScene('selection');
                    this._prevSceneName = currentSceneName;
                }


            },
            _switchMoveMode: function (sender, event) {
                this.view("selectionMode").dom().removeClass("n-topology-nav-mode-selected");
                this.view("moveMode").dom().addClass("n-topology-nav-mode-selected");

                var topo = this.topology();
                var currentSceneName = topo.currentSceneName();
                if (currentSceneName == 'selection') {
                    topo.activateScene(this._prevSceneName || 'default');
                    this._prevSceneName = null;
                }
            },
            _fit: function (sender, event) {
                this.topology().fit();
            },
            _zoombyselection: function (sender, event) {
                var topo = this.topology();
                var currentSceneName = topo.currentSceneName();
                var scene = topo.activateScene('zoomBySelection');
                var icon = sender;
                scene.upon('finish', function fn(sender, bound) {
                    if (bound) {
                        topo.zoomByBound(topo.getInsideBound(bound), topo._recoverStageScale.bind(topo));
                    }
                    topo.activateScene(currentSceneName);
                    icon.dom().removeClass('n-topology-nav-zoom-selection-selected');
                    scene.off('finish', fn, this);

                }, this);
                icon.dom().addClass('n-topology-nav-zoom-selection-selected');
            },
            _out: function (sender, event) {
                var topo = this.topology();
                topo.zoom(topo.scale() + 0.5);
                event.preventDefault();
            },
            _in: function (sender, event) {
                var topo = this.topology();
                topo.zoom(topo.scale() - 0.5);
                event.preventDefault();
            },
            _full: function () {
                this.toggleFull();
            },
            _enterSetting: function (event) {
                this.resolve("setting").addClass("n-topology-nav-setting-open");
            },
            _leaveSetting: function (event) {
                this.resolve("setting").removeClass("n-topology-nav-setting-open");
            },
            cancelFullScreen: function (el) {
                var requestMethod = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullscreen;
                if (requestMethod) { // cancel full screen.
                    requestMethod.call(el);
                } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
                    var wscript = new ActiveXObject("WScript.Shell");
                    if (wscript !== null) {
                        wscript.SendKeys("{F11}");
                    }
                }
            },
            requestFullScreen: function (el) {
                // Supports most browsers and their versions.
                var requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;

                if (requestMethod) { // Native full screen.
                    requestMethod.call(el);
                } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
                    var wscript = new ActiveXObject("WScript.Shell");
                    if (wscript !== null) {
                        wscript.SendKeys("{F11}");
                    }
                }
                return false;
            },
            toggleFull: function () {
                var elem = document.body; // Make the body go full screen.
                var isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) || (document.mozFullScreen || document.webkitIsFullScreen);

                if (isInFullScreen) {
                    this.cancelFullScreen(document);
                    this.fire("leaveFullScreen");
                } else {
                    this.requestFullScreen(elem);
                    this.fire("enterFullScreen");
                }
                return false;
            },

            _openPopover: function (sender, event) {
                this.view("settingPopover").open({
                    target: sender.dom(),
                    offsetY: 3
                });
                this.view('icon').dom().addClass('n-topology-nav-setting-icon-selected');
            },
            _closePopover: function () {
                this.view("settingPopover").close();
            },
            _closeSettingPanel: function () {
                this.view('icon').dom().removeClass('n-topology-nav-setting-icon-selected');
            },
            _switchTheme: function (sender, event) {
                this.topology().theme(event.target.value);
            }
        }
    });


})(nx, nx.util, nx.global);
(function (nx, util, global) {


    nx.define("nx.graphic.Topology.Search", nx.ui.Component, {
        events: ['openSearchPanel', 'closeSearchPanel', 'changeSearch', 'executeSearch'],
        properties: {
            topology: {},
            math: {}
        },
        view: {
//            content: [
//                {
//                    name: 'searchPopup',
//                    type: 'nx.ui.Popup',
//                    props: {
//                        direction: "right"
//                    },
//                    content: {
//                        name: 'searchCombo',
//                        type: 'nx.ui.ComboBox',
//                        props: {
//                            labelPath: 'label',
//                            width: 160,
//                            showArrow: false
//                        },
//                        events: {
//                            'change': '{#_change}',
//                            'execute': '{#_execute}'
//                        }
//                    }
//                }
//            ]
        },
        methods: {
            onInit: function () {
                this.close();
            },
            open: function (args) {
                var topo = this.topology();

                var combo = this.resolve("searchCombo");

                combo.match(topo.searchMath());

                var popup = this.resolve("searchPopup");


                var nodes = topo.getNodes();

                var data = [];
                nx.each(nodes, function (node) {
//                    data.push({
//                        label: node.label(),
//                        node: node
//                    })


                    data.push(node);
                });


                topo.selectedNodes().clear();


                combo.selectedItem(null);

                combo.value(null);

                combo.items(new nx.data.ObservableCollection(data));


                popup.open(args);


                topo.recover(true);


                this.fire("openSearchPanel");

                //

            },
            close: function () {
                this.resolve("searchPopup").close(true);
                this.resolve("searchCombo").close(true);


                this.fire("closeSearchPanel");
            },
            _change: function (sender, event) {
                var nodes = sender.menu().items();
                var topo = this.topology();

                topo.recover(true);


                this.topology().highlightNodes(nodes);


                this.fire("changeSearch", nodes);
            },
            _execute: function (sender, event) {
                var topo = this.topology();
                topo.recover(true);


                var selectedItem = sender.selectedItem();
                var nodes;

                if (selectedItem) {
                    selectedItem.model().selected(true);
                } else {
                    nodes = sender.menu().items();
                    if (!util.isArray(nodes)) {
                        nodes = nodes.toArray();
                    }
                    nx.each(nodes, function (node) {
                        node.selected(true);
                    });
                }

                this.close();

                this.fire("executeSearch", selectedItem || nodes);

            }

        }
    });


})(nx, nx.util, nx.global);