
// Welcome controller
var app = angular.module('latorta', ['ngRoute']);

var urlwelcome = "http://192.168.1.104:8080/";
var urllatorta = "http://192.168.1.104:8082/";
var socket = io.connect(urllatorta);
/* Directiva para establecer gif de loading durante peticiones http */
app.directive('loading',   ['$http' ,function ($http)
    {
        return {
            restrict: 'A',
            link: function (scope, elm, attrs)
            {
                scope.isLoading = function () {
                    return $http.pendingRequests.length > 0;
                };

                scope.$watch(scope.isLoading, function (v)
                {
                    if(v){
                        elm.show();
                    }else{
                        elm.hide();
                    }
                });
            }
        };

	}]);

app.factory("Service", function () {
    var pedido = {
    	Total: 0.0,
    	Pedidos: []
    };
    var user = {};

    if(localStorage.getItem("pedido") != null)
		pedido = JSON.parse(localStorage.getItem("pedido"));

    function getPedido() {
        return pedido;
    }
    function setPedido(newPedido) {
        pedido = newPedido;
    }

    function getUser() {
        return user;
    }
    function setUser(newUser) {
        user = newUser;
    }

    return {
        getPedido: getPedido,
        setPedido: setPedido,
        getUser: getUser,
        setUser: setUser,
    }
});

/* Configuración de Routes */
app.config(['$routeProvider', '$locationProvider',
	function($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'views/signin.html',
				controller: 'SignInCtrl',
				controllerAs: 'singin'
			})
			.when('/torterias', {
				templateUrl: 'views/torterias.html',
				controller: 'TorteriasCtrl',
				controllerAs: 'torterias'
			})
			.when('/Torteria', {
				templateUrl: 'views/torteria.html',
				controller: 'TorCtrl',
				controllerAs: 'tor'
			})
			.when('/productos', {
				templateUrl: 'views/productos.html',
				controller: 'ProductoCtrl',
				controllerAs: 'productos'
			})
			.when('/pedido', {
				templateUrl: 'views/pedido.html',
				controller: 'PedidoCtrl',
				controllerAs: 'pedido'
			})
			.when('/lista', {
				templateUrl: 'views/lista.html',
				controller: 'ListaCtrl',
				controllerAs: 'lista'
			})
			.when('/detalles', {
				templateUrl: 'views/detalles.html',
				controller: 'DetallesCtrl',
				controllerAs: 'detalles'
			})
		$locationProvider.html5Mode(true);
}]);


/* Controlador para los navbars */
app.controller('HeaderCtrl', function($scope, $location, Service, $http) {
	$scope.$watch(function () { return Service.getPedido();         }, function (value) {
        $scope.pedido = value;
    });

    $scope.$watch(function () { return Service.getUser();         }, function (value) {
        $scope.user = value;
    });

	$scope.showSearchBar = function(){
		$("#open-browser").fadeOut(200);
		$("#close-browser").fadeIn(300);
		$("#browser").fadeIn(300);
		$("#search").focus();
	}

	$scope.logout = function(){
		localStorage.removeItem("latortauser");
		localStorage.removeItem("torteria");
		localStorage.removeItem("pedido");
		$location.path('');
	}

	var urls = ['Torteria', 'productos', 'pedido'];
	var urls2 = ['Torteria', 'lista', 'detalles'];

	$scope.go = function(){
		var location = $location.path();
		var locationparts = location.split("/");
		var path = locationparts[1] + '/' + locationparts[2];
		if($scope.before === path || $scope.before == undefined){
			var index = urls.indexOf(path);
			if(index > 0)
				$scope.before = urls[index-1];
			else{
				index = urls2.indexOf(path);
				if(index > 0)
					$scope.before = urls[index-1];
			}
		}
		$location.path($scope.before);
	}

	$scope.href = function(url){
		var location = $location.path();
		var locationparts = location.split("/");
		var path = locationparts[1] + '/' + locationparts[2];
		$scope.before = path;
		$location.path(url);
	}

	$scope.send = function(){
		var pedido = JSON.parse(localStorage.getItem("pedido"));
		var user = JSON.parse(localStorage.getItem("latortauser"));
		var torteria = JSON.parse(localStorage.getItem("torteria"));
		pedido.user = user;
		pedido.torteria = torteria._id;
		// Creamos el pedido
		$http.post(urllatorta+"apiv/create", pedido).success(function(response){
			//console.log(JSON.stringify(response));
			if(response.status){
				/* Se inserto la venta y ahora enviamos las ventas unitarias */
				pedido.Pedidos.forEach(function(item, index){
					item.Venta = response.venta._id;
					$http.post(urllatorta+"apip/create", item).success(function(resp){

					});
				});
				pedido.VENCOD = response.venta.VENCOD;
				pedido.VENCOS = response.venta.VENCOS;
				//socket.emit("nuevopedido", pedido);
				var lista_de_pedidos = [];

				if(localStorage.getItem("lista_de_pedidos") == null)
					localStorage.setItem("lista_de_pedidos", JSON.stringify(lista_de_pedidos));

				lista_de_pedidos = JSON.parse(localStorage.getItem("lista_de_pedidos"));
				lista_de_pedidos[lista_de_pedidos.length] = pedido;
				localStorage.setItem("lista_de_pedidos", JSON.stringify(lista_de_pedidos));
				$scope.pedido = {Total: 0, Pedidos: []};
				localStorage.removeItem("pedido");
				$scope.setPedido = Service.setPedido($scope.pedido);
				/*pedido.enviadoatorteria = true;
				pedido.VENCOD = response.VENCOD;
				$scope.pedido = pedido;
				localStorage.setItem("pedido", JSON.stringify(pedido));
				showConfirm();*/
			}
		}).error(function(e){alert(JSON.stringify(e))});
	}

	$scope.setPedido = Service.setPedido;

	socket.on("notificacioncliente", function(data){
		if($scope.user._id == data.user._id){
			alert("Se ha servido tu pedido, puedes ir a recogerlo.");
		}
	})

	// process the confirmation dialog result
    function onConfirm(buttonIndex) {
        if(buttonIndex === 1){
        	var pedido = JSON.parse(localStorage.getItem("pedido"));
			var user = JSON.parse(localStorage.getItem("latortauser"));
			var torteria = JSON.parse(localStorage.getItem("torteria"));
			pedido.user = user;
			pedido.torteria = torteria._id;
        }
    }

    // Show a custom confirmation dialog
    //
    function showConfirm() {
        navigator.notification.confirm(
            'Enviar pedido?',  // message
            onConfirm,              // callback to invoke with index of button pressed
            'Enviar pedido',            // title
            'Enviar,Canvelar'          // buttonLabels
        );
    }

    $scope.$on('$locationChangeSuccess', function(/* EDIT: remove params for jshint */) {
        var path = $location.path();
        alert(path)
        if(localStorage.getItem("latortauser") != null){
			var latortauser = JSON.parse(localStorage.getItem("latortauser"));
			$scope.user = latortauser;
		}
        $scope.templateUrl = (path === '/torterias') ? 'includes/navbarwithsearch.html' : '';
        $scope.templateUrl = (path === '/Torteria') ? 'includes/navbar.html' : $scope.templateUrl;
        $scope.templateUrl = (path === '/productos') ? 'includes/navbarsearchcar.html' : $scope.templateUrl;
        $scope.templateUrl = (path === '/pedido' || path == '/lista' || path == '/detalles') ? 'includes/navbarpedido.html' : $scope.templateUrl;
        //$scope.templateUrl = (path === '/pedido') ? 'includes/navbarbefore.html' : $scope.templateUrl;
        //EDIT: cope with other path
        //$scope.templateUrl = (path==='/signin' || path==='/contact') ? 'template/header4signin.html' : 'template/header4normal.html' ;
    });
});

/* Controlador principal para el login */
app.controller('SignInCtrl', function($scope, $http, $location) {
    /* Iniciamos la informacion del usuario si existe */
	if(localStorage.getItem("latortauser") != null){
		$location.path('torterias');
	}
	/* Funcion de login */
	$scope.login = function(){
		$scope.datalogin.isValidate = true;
		$http.post(urlwelcome+"home/login", $scope.datalogin).success(function(response) {
            if(response.status){
		        localStorage.setItem("latortauser", JSON.stringify(response.user));
		        $location.path('torterias');
            }else{
            	$(".message").html("<div class='alert alert-warning'><a(href='#', class='close', data-dismiss='alert', aria-label='close') &times;</a>"+response.message+"</div>")
            	$(".message").css("display","block");
            }
        });
	}
});

/* Controlador principal para el login */
app.controller('TorteriasCtrl', function($scope, $http, $location) {
    /* Iniciamos la informacion del usuario si existe */
	if(localStorage.getItem("latortauser") == null){
		$location.path('');
	}

	if(localStorage.getItem("torteria") != null){
		$location.path('Torteria');
	}

	/* Obtenemos la lista de torterias */
	getTorterias();

	function getTorterias(){
		$http.get(urllatorta+"api/getAll").success(function(response){
			if(response.status){
				var torterias = response.torteria;
				if(torterias.length > 0){
					$scope.torterias = torterias;
					$scope.message = "";
				}else{
					$scope.message = "No hay torterias :(";
				}
			}else{
				$scope.message = "No hay torterias :(";
			}
		});
	}
	/* Ocultamos la barra de búsqueda */
	$scope.hideSearchBar = function(){
		$("#open-browser").fadeIn(300);
		$("#close-browser").fadeOut(200);
		$("#browser").fadeOut(200);
		$scope.busqueda = "";
	}
	/* Seleccionamos una torteria */
	$scope.select = function(torteria){
		localStorage.setItem("torteria", JSON.stringify(torteria));
		$location.path("Torteria");
	}
});

/* Controlador principal para una torteria */
app.controller('TorCtrl', function($scope, $http, $location) {
	$('.carousel').carousel()
    /* Iniciamos la informacion del usuario si existe */
	if(localStorage.getItem("latortauser") == null){
		$location.path('');
	}

	/* Variables globales/ */
	$scope.torteria = JSON.parse(localStorage.getItem("torteria"));
});

/* Controlador principal para los productos */
app.controller('ProductoCtrl', function($scope, $http, $location, Service) {
    /* Iniciamos la informacion del usuario si existe */
	if(localStorage.getItem("latortauser") == null){
		$location.path('');
	}

	/* Obtenemos la lista de torterias */
	$scope.torteria = JSON.parse(localStorage.getItem("torteria"));
	$scope.user = JSON.parse(localStorage.getItem("latortauser"));
	if(localStorage.getItem("pedido") != null)
		$scope.pedido = JSON.parse(localStorage.getItem("pedido"));

	getProductos();

	function getProductos(){
		$http.get(urllatorta+"apipd/get/"+$scope.user.USUCEL+"/"+$scope.user.USUPAS+"/"+$scope.torteria._id).success(function(response){
			if(response.status){
				$scope.productos = response.producto;
				if($scope.productos.length > 0)
					$scope.message = "";
				else
					$scope.message = "No hay productos :(";
			}else{
				$scope.message = "No hay productos :(";
			}
		});
	}
	/* Ocultamos la barra de búsqueda */
	$scope.hideSearchBar = function(){
		$("#open-browser").fadeIn(300);
		$("#close-browser").fadeOut(200);
		$("#browser").fadeOut(200);
		$scope.busqueda = "";
	}
	/* Agregamos un producto al carrito */
	$scope.select = function(producto){
		if($scope.user.USUSAL < producto.PROPRE){
			alert("No cuentas con saldo suficiente para comprar este producto.");
			return;
		}
		var pedido = {
			Total : 0.0,
			Pedidos : []
		};

		if(localStorage.getItem("pedido") == null)
			localStorage.setItem("pedido", JSON.stringify(pedido));

		pedido = JSON.parse(localStorage.getItem("pedido"));
		var index = productoInComanda(producto._id);
		if(index > -1){
			pedido.Pedidos[index].PROCAN = pedido.Pedidos[index].PROCAN + 1;
			pedido.Pedidos[index].PROIMP = pedido.Pedidos[index].PROIMP + parseFloat(producto.PROPRE);
			pedido.Total = pedido.Total + parseFloat(producto.PROPRE);
		}else{
			producto.PROCAN = 1;
			producto.PROIMP = parseFloat(producto.PROPRE);
			pedido.Pedidos[pedido.Pedidos.length] = producto;
			pedido.Total = pedido.Total + parseFloat(producto.PROPRE);
		}
		$scope.user.USUSAL = $scope.user.USUSAL - producto.PROPRE;
		localStorage.setItem("latortauser", JSON.stringify($scope.user));
		localStorage.setItem("pedido", JSON.stringify(pedido));
		$scope.pedido = pedido;
		$scope.setPedido(pedido);
		$scope.setUser($scope.user);
	}
	/* Eliminamos un producto del carrito */
	$scope.delete = function(producto){
		var index = productoInComanda(producto._id);
		if(index > -1){
			var pedido = JSON.parse(localStorage.getItem("pedido"));
			var pedidounitario = pedido.Pedidos[index];
			if(pedidounitario.PROCAN > 1){
				pedido.Pedidos[index].PROCAN = pedido.Pedidos[index].PROCAN - 1;
				pedido.Pedidos[index].PROIMP = pedido.Pedidos[index].PROIMP - parseFloat(producto.PROPRE);
			}else{
				pedido.Pedidos.splice(index, 1);	
			}
			$scope.user.USUSAL = $scope.user.USUSAL + producto.PROPRE;
			localStorage.setItem("latortauser", JSON.stringify($scope.user));
			pedido.Total = pedido.Total - parseFloat(producto.PROPRE);
			localStorage.setItem("pedido", JSON.stringify(pedido));
			$scope.pedido = pedido;
			$scope.setPedido(pedido);
			$scope.setUser($scope.user);
		}
	}

	function productoInComanda(id){
		pedido = JSON.parse(localStorage.getItem("pedido"));
		for (var i = 0; i < pedido.Pedidos.length; i++) {
			if(pedido.Pedidos[i]._id == id) 
				return i;
		}
		return -1;
	}

	$scope.setPedido = Service.setPedido;
	$scope.setUser = Service.setUser;
});

/* Pedido */
app.controller('PedidoCtrl', function($scope, $http, $location, Service) {

	$scope.$watch(function () { return Service.getPedido();         }, function (value) {
        $scope.Pedido = value;
    });
    /* Iniciamos la informacion del usuario si existe */
	if(localStorage.getItem("latortauser") == null){
		$location.path('');
	}

	/* Variables globales/ */
	$scope.torteria = JSON.parse(localStorage.getItem("torteria"));
	$scope.user = JSON.parse(localStorage.getItem("latortauser"));
	if(localStorage.getItem("pedido") != null)
		$scope.Pedido = JSON.parse(localStorage.getItem("pedido"));

});

/* Pedido */
app.controller('ListaCtrl', function($scope, $http, $location) {
	localStorage.removeItem("detalles");
    /* Iniciamos la informacion del usuario si existe */
	if(localStorage.getItem("latortauser") == null){
		$location.path('');
	}

	/* Variables globales/ */
	$scope.torteria = JSON.parse(localStorage.getItem("torteria"));
	$scope.user = JSON.parse(localStorage.getItem("latortauser"));
	$scope.lista_pedidos = []
	if(localStorage.getItem("lista_de_pedidos") != null)
		$scope.lista_pedidos = JSON.parse(localStorage.getItem("lista_de_pedidos"));

	$scope.detalles = function(pedido){
		alert(JSON.stringify(pedido));
		localStorage.setItem("detalles", JSON.stringify(pedido));
		$location.path("detalles");
	}

});

/* Pedido */
app.controller('DetallesCtrl', function($scope, $http, $location, Service) {

	$scope.$watch(function () { return Service.getPedido();         }, function (value) {
        $scope.Pedido = value;
    });
    /* Iniciamos la informacion del usuario si existe */
	if(localStorage.getItem("latortauser") == null){
		$location.path('');
	}

	/* Variables globales/ */
	$scope.torteria = JSON.parse(localStorage.getItem("torteria"));
	$scope.user = JSON.parse(localStorage.getItem("latortauser"));
	alert("Detalles: "+localStorage.getItem("detalles"))
	if(localStorage.getItem("detalles") != null)
		$scope.Pedido = JSON.parse(localStorage.getItem("detalles"));

	alert("Pedido: "+JSON.stringify($scope.Pedido));

});
