package com.zono.intro;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;
import android.graphics.Color;
import android.content.Intent;
import android.net.Uri;

public class MainActivity extends Activity {
  private WebView web;

  @Override public void onCreate(Bundle b){
    super.onCreate(b);
    getWindow().setStatusBarColor(Color.BLACK);
    getWindow().setNavigationBarColor(Color.BLACK);

    web = new WebView(this);
    web.setBackgroundColor(Color.BLACK);
    setContentView(web);

    WebSettings s=web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setMediaPlaybackRequiresUserGesture(false);

    if(android.os.Build.VERSION.SDK_INT>=21){
      s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
      CookieManager.getInstance().setAcceptThirdPartyCookies(web,true);
    }

    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r){
        Uri u=r.getUrl();
        String scheme=u.getScheme()==null?"":u.getScheme();
        if("http".equalsIgnoreCase(scheme)||"https".equalsIgnoreCase(scheme)) return false;
        try{ startActivity(new Intent(Intent.ACTION_VIEW,u)); }catch(Exception e){}
        return true;
      }
    });

    web.loadUrl("file:///android_asset/index.html");
  }

  @Override public void onBackPressed(){
    if(web!=null && web.canGoBack()) web.goBack();
    else super.onBackPressed();
  }

  @Override protected void onDestroy(){
    if(web!=null) web.destroy();
    super.onDestroy();
  }
}
