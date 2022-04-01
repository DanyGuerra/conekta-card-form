const pagarBtn = document.getElementById("pagar_btn");
pagarBtn.addEventListener("click", (e) => {
  e.preventDefault();
  getToken();
});

const getToken = () => {
  let tarjetahabiente = document.getElementById("tarjetahabiente").value;
  let numero = document.getElementById("numero").value;
  let cvc = document.getElementById("cvc").value;
  let expMes = document.getElementById("exp-mes").value;
  let expAno = document.getElementById("exp-ano").value;

  let data = {
    card: {
      number: numero,
      name: tarjetahabiente,
      exp_year: expAno,
      exp_month: expMes,
      cvc: cvc,
    },
  };

  //Definir la llave ppublica dependiendo de la sucursal
  Conekta.setPublicKey("LLave publica");
  Conekta.Token.create(data, successToken, errorToken);
};

let successToken = function (token) {
  const datosOrden = obtenerDatosOrden();
  pagar(token, datosOrden);
};

let errorToken = function (err) {
  /* err keys: object, type, message, message_to_purchaser, param, code */
  console.log(err);
};

const pagar = (token, datosOrden) => {
  console.log(token);
  const opcionesCrearCliente = {
    method: "POST",
    // mode: "no-cors",
    headers: {
      //Definir llave privada dependiendo de la sucursal
      // "Access-Control-Allow-Origin": "http://127.0.0.1:5500/INNATE/pago.html",
      Authorization: "Bearer llave privada",
      Accept: "application/vnd.conekta-v2.0.0+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      livemode: false,
      name: datosOrden.paciente,
      email: datosOrden.correo,
      phone: datosOrden.telefono,
      payment_sources: [
        {
          type: "card",
          token_id: token.id, //Token paso anterior response.id
        },
      ],
    }),
  };

  fetch("https://api.conekta.io/customers", opcionesCrearCliente)
    .then((response) => response.json())
    .then((response) => {
      console.log("Comprador");
      console.log(response);

      const opcionesCrearOrden = {
        method: "POST",
        // mode: "no-cors",
        headers: {
          // "Access-Control-Allow-Origin":
          //   "http://127.0.0.1:5500/INNATE/pago.html",

          //Definir llave privada dependiendo de la sucursal
          Authorization: "Bearer llave privada",
          Accept: "application/vnd.conekta-v2.0.0+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: datosOrden.precioCentavos,
          currency: "MXN",
          amount_refunded: 0,
          customer_info: {
            customer_id: response.id, //Id del cliente paso anterior
          },

          metadata: {
            Integration: "API", //Nos indica que te has integrado por tu cuenta utilizando la API Conekta
            Integration_Type: "PHP 8.0", //Nos menciona el lenguaje que utilizas para integrarte
            // Objeto de Metadatos para ingresar información de interés de tu comercio y después recuperarlo por Reporting, puedes ingresar máximo 100 elementos y puedes ingresar caracteres especiales
          },
          line_items: [
            {
              //Informacion de la orden
              name: "Cita sucursal del valle",
              unit_price: datosOrden.precioCentavos,
              quantity: 1,
              description: "Description",
            },
          ],
          charges: [
            {
              payment_method: {
                //"monthly_installments": 3, //Este parámetro se usa para incluir MSI en cargo único
                type: "default",
              },
            },
          ],
          discount_lines: [
            {
              code: "Cupón de descuento en orden sin cargo",
              amount: 0,
              type: "loyalty", //'loyalty', 'campaign', 'coupon' o 'sign'
            },
          ],
          tax_lines: [
            {
              description: "IVA",
              amount: 0,
              metadata: {
                // Objeto de Metadatos para ingresar información de interés de tu comercio y después recuperarlo por Reporting, puedes ingresar máximo 100 elementos y puedes ingresar caracteres especiales
                IEPS: "1800",
              },
            },
          ],
        }),
      };
      fetch("https://api.conekta.io/orders", opcionesCrearOrden)
        .then((response) => response.json())
        .then((response) => {
          console.log("Orden pagada");
          console.log(response);
        })
        .catch((err) => console.error(err));
    })
    .catch((err) => console.error(err));
};

const obtenerDatosOrden = () => {
  let datosForm;
  let paciente = document.getElementById("tarjetahabiente").value;
  let correo = document.getElementById("correo").value;
  let telefono = document.getElementById("telefono").value;

  datosForm = {
    paciente,
    correo,
    telefono,
    precioCentavos: "75000", //Asignar el precio de la cita en centavos
  };

  return datosForm;
};

// esta función se ejecuta al cargar la página de pago para obtener el precio del mes, previamente seleccionado
function setPrecio() {
  const url_string = window.location.href;
  const url = new URL(url_string);
  const param = url.searchParams.get("mes");

  fetch("http://localhost:3000/precioMes?id=" + param)
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("precio").innerText = data[0].precio;
      document.getElementById("mes").innerText = data[0].mes.toUpperCase();
    });
}
