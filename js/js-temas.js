/* Temas: solo para los temas.
   Campos de perfil con clase slugificada, color del autor como
   --user-color del post, portada e icono del perfil en el banner del post.
   CONFIGURACIÓN arriba del todo. Si cambias los nombres de los campos
   "icon" o "post cover", cámbialos también aquí abajo. */
!function() {


	/*
	 * CONFIGURACIÓN
	 */
	const settings = {
		semicolon: false, // Mostrar dos puntos (:) después del título del campo.
		cleanUp: true, // Eliminar HTML del título del campo que añade colores.
		scrollAvatar: false,
	},



	slugify = str => {
        const from = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;',
        to = 'aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------',
        reg = new RegExp(from.split('').join('|'), 'g');

        return str.trim().toLowerCase()
        		.replace(/\s+/g, '-')
        		.replace(reg, c => to.charAt(from.indexOf(c)))
        		.replace(/&/g, '-and-')
        		.replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
    },

    hideSemicolon = (label, name) => {
        if (label.firstElementChild)
            label.lastChild.remove();
        else
            label.textContent = name;
    },

    main = _ => {

    	document.querySelectorAll('.postprofile-field').forEach(p => {
    		const labelcontainer = p.querySelector('.postprofile-field-label'),
    		label = labelcontainer.querySelector('.label'),
            name = label.textContent.replace(/ *: *$/, '');

    		p.classList.add('postprofile-field-' + slugify(name));

    		if (settings.cleanUp) {
    			labelcontainer.textContent = settings.semicolon ? name + ': ' : name;
    		} else if (!settings.semicolon) {
                hideSemicolon(label, name)
    		}
    	});

	$(".post").each(function( index ) {
          let color = $(this).find(".rtopicuser strong").css("color");
          $(this).get(0).style.setProperty("--user-color", color);
          if($(this).find(".postprofile .postprofile-field-post-cover img").length > 0)
          	$(this).find(".rtopicbgimg img").replaceWith($(this).find(".postprofile .postprofile-field-post-cover img"));
          if($(this).find(".postprofile .postprofile-field-icon img").length > 0)
          	$(this).find(".rprofileicon img").replaceWith($(this).find(".postprofile .postprofile-field-icon img"));
          $(this).find(".postprofile-field-post-cover span.postprofile-field-label").css("display", "none");

          let elementPosition = $(this).find('.postprofile a > img').offset();

          let nextPosition = $('.post').eq(index + 1);
          if(nextPosition.length == 0)
            nextPosition = $(".noprint").offset();
          else
            nextPosition = nextPosition.offset();

          if(settings.scrollAvatar) {
            $(window).scroll(function(){
                    if($(window).scrollTop() + 120 > elementPosition.top
                      && $(window).scrollTop() + 600 < nextPosition.top){
                        $('.postprofile').eq(index).addClass("fixedAvatar");
                    } else {
                        $('.postprofile').eq(index).removeClass("fixedAvatar");
                    }
            });
          }
        });

    };

    document.addEventListener('DOMContentLoaded', main);
}();
