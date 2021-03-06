package threewks.controller;

import com.google.common.collect.ImmutableMap;
import com.threewks.thundr.http.exception.NotFoundException;
import com.threewks.thundr.request.Request;
import com.threewks.thundr.view.handlebars.HandlebarsView;

import java.util.Map;

import static com.google.common.collect.Maps.newHashMap;


public class IndexController {

    private final String applicationName;

    public IndexController(String applicationName) {
        this.applicationName = applicationName;
    }

    /**
     * Serves the the index page for a single page application. The index page is generated by webpack into the target folder
     * along with the rest of the Handlebars templates. Though the extension is .html it is in fact a Handlebars template with
     * placeholders for the various meta and Open Graph tags. The .html extension is deliberate however as other extensions don't
     * play well with the webpack dev server, which will attempt to guess the content type of the file by its extension which results
     * in the browser rendering plain text instead of HTML. It's also worth noting that in local development this endpoint is never
     * called with the webpack dev server intercepting the call and serving the index file up itself.
     * <p>
     * The template is designed so that you may override the meta tags as necessary (e.g. sharing custom pages, or resources). To do
     * this, create a route to your sharable resource, copy this controller method, generate the default model and override keys
     * as necessary.
     */
    public HandlebarsView index(Request request) {
        return new HandlebarsView("index.html", generateDefaultModel(request));
    }

    public void notFound() {
        throw new NotFoundException("Not found");
    }

    /**
     * Generate the default model including Open Graph meta tags. These can be overridden as needed.
     */
    private Map<String, Object> generateDefaultModel(Request request) {
        return newHashMap(ImmutableMap.<String, Object>of(
            "meta", newHashMap(ImmutableMap.<String, Object>of(
                "url", request.getRequestUri(),
                "title", applicationName,
                "description", String.format("Try %s today!", applicationName),
                "image", "https://lh3.googleusercontent.com/sm_h6TfeNXSFRKr3hB8C9Ir8lcWa4PYf56OwLeOieU3Y9G1HYiy-N0AvZzAN2dgJBnwWq-HKM5Bo9atsos8_FnXfHOJlXgLjjB_ZKaNfBt8rZTIOQad2x0YEbiSLOjj99sHRmbH_"
            ))
        ));
    }
}
