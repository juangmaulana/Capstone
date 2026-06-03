import './users'
import './roles'
import './plants'
import './identifications'
import './auth'
import { registry } from '../registry'

registry.registerComponent(
  'securitySchemes',
  'bearerAuth',
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  }
)