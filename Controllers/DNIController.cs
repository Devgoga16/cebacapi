using System.Text.Json;
using ApiModel.General;
using Microsoft.AspNetCore.Mvc;
using RestSharp;

namespace UnifyAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DNIController : ControllerBase
    {
        public DNIController()
        {
        }

        [HttpGet]
        [Route("consultDocument/{documentNumber}")]
        public IActionResult ConsultDocument(string documentNumber)
        {
            try
            {
                var client = new RestClient("https://api.apis.net.pe/v1/dni?numero=" + documentNumber);
                var request = new RestRequest();

                request.Method = Method.Get;
                request.AddHeader("Accept", "application/json");
                request.AddHeader("Authorization", "Bearer apis-token-3781");

                var apiReponse = client.Execute(request);
                var statusResponse = apiReponse.StatusDescription;

                if (statusResponse == "Not Found")
                {
                    throw new Exception("NotFoundDocument");
                }
                else
                {
                    var JsonApiResponse = JsonSerializer.Deserialize<ResponseApiDNI>(apiReponse.Content ?? "" );

                    return Ok(JsonApiResponse);

                }
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
