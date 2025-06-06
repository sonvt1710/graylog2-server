<#if _title>There was no leader node detected in the cluster</#if>

<#if _description><span>
Certain operations of the server require the presence of a leader node, but no such leader was started.
Please ensure that one of your server nodes contains the setting <code>is_leader = true</code> in its
configuration and that it is running. Until this is resolved index cycling will not be able to run, which
means that the index retention mechanism is also not running, leading to increased index sizes. Certain
maintenance functions as well as a variety of web interface pages (e.g. Dashboards) are unavailable.
</span></#if>
