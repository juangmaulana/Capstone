import './users'
import './roles'
import './plants'
import './identifications'
import './images'
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