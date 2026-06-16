using LtlOrderManagement.Api.Data;
using LtlOrderManagement.Api.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace LtlOrderManagement.Api.Controllers;

[ApiController]
[Route("api/reference-data")]
public class ReferenceDataController : ControllerBase
{
    [HttpGet]
    public ActionResult<ReferenceDataDto> Get()
        => Ok(new ReferenceDataDto { Lists = ReferenceData.Lists });
}
