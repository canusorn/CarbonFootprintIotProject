import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import router from './router'

// PrimeVue CSS
import 'primevue/resources/themes/lara-light-green/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// PrimeVue Components
import Button from 'primevue/button'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Panel from 'primevue/panel'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Tooltip from 'primevue/tooltip'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'

const app = createApp(App)

app.use(PrimeVue)
app.use(router)

// Register PrimeVue components
app.component('Button', Button)
app.component('Card', Card)
app.component('Chart', Chart)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Panel', Panel)
app.component('ProgressBar', ProgressBar)
app.component('Tag', Tag)
app.component('Badge', Badge)
app.component('Divider', Divider)

// Register directives
app.directive('tooltip', Tooltip)

app.mount('#app')