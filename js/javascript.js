
/* Loading page */
$(window).load(function() {
	// Animate loader off screen
	$(".se-pre-con").fadeOut("slow");
	
});

/* DOM loaded*/
$(function(){
	/* Lista de modales */
	$("#logout").click(function(){
		localStorage.removeItem("latortauser");
	});
});

