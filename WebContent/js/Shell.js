(function(nx) {
    /**
     * define application
     */
    var Shell = nx.define(nx.ui.Application, {
        methods: {
            start: function() {
                //your application main entry
                console.log("Hello NeXt & NeXt Topology");
            }
        }
    });

    /**
     * create application instance
     *
     */
    var shell = new Shell();

    /**
      * invoke start method 
      */
    shell.start();
})(nx);