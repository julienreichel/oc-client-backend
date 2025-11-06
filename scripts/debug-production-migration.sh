#!/bin/bash

# Debug script to check production configuration
# Run this to compare environments and identify differences

echo "=== Production vs Development Environment Debug ==="
echo ""

# Function to check namespace and secrets
check_environment() {
    local namespace=$1
    local env_name=$2
    
    echo "--- Checking $env_name Environment ($namespace) ---"
    
    # Check if namespace exists
    if kubectl get namespace "$namespace" &>/dev/null; then
        echo "✅ Namespace '$namespace' exists"
    else
        echo "❌ Namespace '$namespace' does not exist"
        return 1
    fi
    
    # Check database secret
    if kubectl get secret db -n "$namespace" &>/dev/null; then
        echo "✅ Secret 'db' exists in $namespace"
        
        # Check if DATABASE_URL key exists
        if kubectl get secret db -n "$namespace" -o jsonpath='{.data.DATABASE_URL}' &>/dev/null; then
            echo "✅ DATABASE_URL key exists in db secret"
            
            # Decode and show structure (without exposing credentials)
            local db_url=$(kubectl get secret db -n "$namespace" -o jsonpath='{.data.DATABASE_URL}' | base64 -d)
            local masked_url=$(echo "$db_url" | sed 's/:[^:@]*@/:***@/g')
            echo "   URL structure: $masked_url"
        else
            echo "❌ DATABASE_URL key missing in db secret"
        fi
    else
        echo "❌ Secret 'db' does not exist in $namespace"
    fi
    
    # Check ghcr-creds secret
    if kubectl get secret ghcr-creds -n "$namespace" &>/dev/null; then
        echo "✅ Secret 'ghcr-creds' exists in $namespace"
    else
        echo "❌ Secret 'ghcr-creds' does not exist in $namespace"
    fi
    
    # Check recent deployments
    echo "Recent deployments:"
    kubectl get deployments -n "$namespace" --sort-by=.metadata.creationTimestamp | tail -5
    
    # Check recent jobs
    echo "Recent migration jobs:"
    kubectl get jobs -n "$namespace" --sort-by=.metadata.creationTimestamp | grep migration | tail -3
    
    echo ""
}

# Check current kubectl context
echo "Current kubectl context:"
kubectl config current-context
echo ""

# Check both environments
check_environment "oc-client" "Production"
check_environment "oc-dev-client" "Development" 

echo "=== Suggested Debug Steps ==="
echo ""
echo "1. Deploy debug pod to production:"
echo "   kubectl apply -f scripts/debug-db-connection.yaml -n oc-client"
echo "   kubectl logs debug-db-connection -n oc-client -f"
echo ""
echo "2. Check recent migration job logs:"
echo "   kubectl logs jobs/oc-client-backend-migration -n oc-client"
echo ""
echo "3. Compare database connectivity:"
echo "   # Production test"
echo "   kubectl get secret db -n oc-client -o jsonpath='{.data.DATABASE_URL}' | base64 -d"
echo "   # Development test" 
echo "   kubectl get secret db -n oc-dev-client -o jsonpath='{.data.DATABASE_URL}' | base64 -d"
echo ""
echo "4. Manual migration test:"
echo "   kubectl run temp-migration --rm -i --tty --image=ghcr.io/julienreichel/oc-client-backend:latest -n oc-client -- /bin/sh"
echo "   # Inside the pod:"
echo "   # npm run db:generate && npm run db:migrate"