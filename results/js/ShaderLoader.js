THREE.ShaderLoader= function (){
}
// our shaders base path
THREE.ShaderLoader.base = "shaders/";

// our shaders loader
THREE.ShaderLoader.loadShaders = function loadShaders(shaders, callback) {
    gl = renderer.context;
    function onreadystatechange() {
        var
            xhr = this,
            i = xhr.i
        ;
        if (xhr.readyState == 4) {
            shaders[i] = gl.createShader(
                shaders[i].split('.').slice(-1)[0] == "fragment" ?
                    gl.FRAGMENT_SHADER :
                    gl.VERTEX_SHADER
            );
            gl.shaderSource(shaders[i], xhr.responseText);
            gl.compileShader(shaders[i]);
            if (!gl.getShaderParameter(shaders[i], gl.COMPILE_STATUS))
                throw gl.getShaderInfoLog(shaders[i])
            ;
            !--length && typeof callback == "function" && callback(shaders);
        }
    }
    for (var
        shaders = [].concat(shaders),
        asynchronous = !!callback,
        i = shaders.length,
        length = i,
        xhr;
        i--;
    ) {
        (xhr = new XMLHttpRequest).i = i;
        xhr.open("get", THREE.ShaderLoader.base + shaders[i] + ".c", asynchronous);
        if (asynchronous) {
            xhr.onreadystatechange = onreadystatechange;
        }
        xhr.send(null);
        onreadystatechange.call(xhr);
    }
    return shaders;
}

